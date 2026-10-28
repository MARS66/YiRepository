// utils/playAudio.ts
// 音频播放逻辑：输入日期，读取对应的 5 段彝历语音素材（年/月/日/月相/塔博），
// 裁掉首尾静音后合成为一个完整音频播放；合成不可用时自动回退为分段播放。
//
// WebAudio 用法参考 utils/howler.js：上下文只创建一个并反复复用，
// 合成后的 AudioBuffer 交给新建的 BufferSource 播放，起播前先停掉上一个节点。
//
// 针对“不能重复播放”的加固（任何一次 stop 之后都必须能重新 play）：
//  - stop() 先复位状态（mode / 定时器 / 节点引用），再操作原生对象，
//    且所有原生调用都做 try/catch 兜底，避免 stop 抛错后 playing 卡在 true，
//    导致后续每次点击都被当成“停止”
//  - InnerAudioContext 的 onEnded / onError 只在分段回退模式下生效，
//    防止 stop() 触发的回调串进下一次播放，把新一轮播放提前终止
//  - 起播前统一清理上一轮的 BufferSource，解码 / 合成结果按素材缓存，二次播放秒开
//  - onended 异常提前触发时回退分段播放，保证每次点击都有声音
import { getYiTaBoo } from './yinar'

const SILENCE_THRESHOLD = 0.02
const EDGE_PADDING_SEC = 0.03
const RESUME_TIMEOUT_MS = 1200 // resume 超时判定，防止 Promise 永不返回导致静默
const EARLY_END_MS = 300 // onended 早于该时长触发视为异常，回退分段播放

function readAudioFile(filePath: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      success: (res: any) => resolve(res.data as ArrayBuffer),
      fail: reject
    })
  })
}

function decodeAudioData(ctx: any, data: ArrayBuffer): Promise<any> {
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(data, (buffer: any) => resolve(buffer), (err: any) => reject(err))
  })
}

function isSilentFrame(channels: Float32Array[], index: number): boolean {
  for (let c = 0; c < channels.length; c++) {
    if (Math.abs(channels[c][index]) > SILENCE_THRESHOLD) return false
  }
  return true
}

function findAudibleRange(channels: Float32Array[], paddingSamples: number) {
  const length = channels[0] ? channels[0].length : 0
  let start = 0
  let end = length - 1
  while (start <= end && isSilentFrame(channels, start)) start++
  while (end >= start && isSilentFrame(channels, end)) end--
  if (start > end) return { start: 0, end: length - 1 }
  start = Math.max(0, start - paddingSamples)
  end = Math.min(length - 1, end + paddingSamples)
  return { start, end }
}

function mergeAudioBuffers(ctx: any, buffers: any[]): any {
  const valid = buffers.filter((b) => b && b.length)
  if (!valid.length) return null
  const sampleRate = valid[0].sampleRate
  if (valid.some((b) => b.sampleRate !== sampleRate)) return null
  const numberOfChannels = valid.reduce((n, b) => Math.max(n, b.numberOfChannels), 1)
  const paddingSamples = Math.round(sampleRate * EDGE_PADDING_SEC)
  const segments = valid.map((b) => {
    const channels: Float32Array[] = []
    for (let c = 0; c < b.numberOfChannels; c++) channels.push(b.getChannelData(c))
    const { start, end } = findAudibleRange(channels, paddingSamples)
    return { channels, start, length: end - start + 1 }
  })
  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0)
  const merged = ctx.createBuffer(numberOfChannels, totalLength, sampleRate)
  const outChannels: Float32Array[] = []
  for (let c = 0; c < numberOfChannels; c++) outChannels.push(merged.getChannelData(c))
  let offset = 0
  for (const seg of segments) {
    for (let c = 0; c < numberOfChannels; c++) {
      const src = seg.channels[Math.min(c, seg.channels.length - 1)]
      outChannels[c].set(src.subarray(seg.start, seg.start + seg.length), offset)
    }
    offset += seg.length
  }
  return merged
}

export interface YiAudioPlayerOptions {
  /** 播放状态变化回调，用于同步页面 UI */
  onPlayingChange?: (playing: boolean) => void
}

/** 当前播放通道：idle 空闲 / web 合成整段播放 / fallback 分段回退播放 */
type PlayMode = 'idle' | 'web' | 'fallback'

export class YiAudioPlayer {
  // 注意：小程序 JS 引擎不支持 class 字段语法，字段只在构造函数中赋值
  private innerAudio!: WechatMiniprogram.InnerAudioContext | null
  private audioList!: string[]
  private audioIndex!: number
  private webAudioCtx!: any
  private bufferSource!: any
  private bufferCache!: { [path: string]: any }
  private mergedCache!: { [key: string]: any }
  private endTimer!: ReturnType<typeof setTimeout> | null
  private token!: number
  private mode!: PlayMode
  private playing!: boolean
  private onPlayingChange?: (playing: boolean) => void

  constructor(options?: YiAudioPlayerOptions) {
    this.onPlayingChange = options ? options.onPlayingChange : undefined
    this.innerAudio = null
    this.audioList = []
    this.audioIndex = 0
    this.webAudioCtx = null
    this.bufferSource = null
    this.bufferCache = {}
    this.mergedCache = {}
    this.endTimer = null
    this.token = 0
    this.mode = 'idle'
    this.playing = false
  }

  get isPlaying() {
    return this.playing
  }

  /**
   * 输入日期（如 'YYYY-MM-DD'）播放对应彝历语音。
   * 播放中再次调用则停止播放。
   */
  play(dateStr: string) {
    if (this.playing) {
      console.log('[playAudio] 播放中，忽略本次调用并停止')
      this.stop()
      return
    }
    const yiDate = getYiTaBoo(dateStr)
    const { yearZodiacIndex, monthZodiacIndex, dayZodiacIndex, dayIndex, tabooIndex } = yiDate
    const files = [
      `/static/Audio/year/${yearZodiacIndex}.m4a`,
      `/static/Audio/month/${monthZodiacIndex}.m4a`,
      `/static/Audio/zoday/${dayZodiacIndex}.m4a`,
      `/static/Audio/moon/${dayIndex}.m4a`,
      `/static/Audio/tabo/${tabooIndex}.m4a`,
    ]
    console.log('[playAudio] play', dateStr)
    // 每次播放前清理上一轮残留（已结束但未释放的节点、定时器、分段状态）
    this.clearPlayback()
    const token = ++this.token
    this.audioList = files
    this.audioIndex = 0
    // WebAudio 上下文在用户点击手势内首次创建（保证 resume 成功率高）
    this.createWebAudioContextInstance(false)
    this.setPlaying(true)
    if (!this.webAudioCtx) {
      console.warn('[playAudio] WebAudio 不可用，回退分段播放')
      this.startFallback(token)
      return
    }
    this.playMergedAudio(files, token)
  }

  /** 停止播放并重置，可重复调用 */
  stop() {
    this.token++ // 作废进行中的异步任务
    this.clearPlayback()
    this.audioList = []
    this.setPlaying(false)
  }

  /** 释放资源（页面卸载时调用） */
  destroy() {
    this.stop()
    if (this.innerAudio) {
      try { this.innerAudio.destroy() } catch (e) {}
      this.innerAudio = null
    }
    if (this.webAudioCtx) {
      try { this.webAudioCtx.close() } catch (e) {}
      this.webAudioCtx = null
    }
    this.bufferCache = {}
    this.mergedCache = {}
  }

  // 读取 5 段素材 → 解码(带缓存) → 裁静音 → 合成一个 AudioBuffer 播放
  private playMergedAudio(files: string[], token: number) {
    const cacheKey = files.join('|')
    this.ensureWebAudioRunning().then((ok: boolean) => {
      if (token !== this.token) return
      if (!ok) {
        console.warn('[playAudio] WebAudio resume 失败/超时，回退分段播放')
        this.startFallback(token)
        return
      }
      const cached = this.mergedCache[cacheKey]
      if (cached) {
        console.log('[playAudio] 命中合成缓存，直接播放')
        this.startSource(cached, token)
        return
      }
      Promise.all(files.map((filePath) => this.loadDecodedBuffer(filePath)))
        .then((buffers: any[]) => {
          if (token !== this.token) return
          const ctx = this.webAudioCtx
          if (!ctx) {
            this.startFallback(token)
            return
          }
          const merged = mergeAudioBuffers(ctx, buffers)
          if (!merged) {
            console.warn('[playAudio] 合成失败，回退分段播放')
            this.startFallback(token)
            return
          }
          this.mergedCache[cacheKey] = merged
          this.startSource(merged, token)
        })
        .catch((err: any) => {
          console.warn('[playAudio] 解码失败，回退分段播放', err)
          if (token === this.token) this.startFallback(token)
        })
    }).catch((err: any) => {
      console.warn('[playAudio] WebAudio 启动异常，回退分段播放', err)
      if (token === this.token) this.startFallback(token)
    })
  }

  // 确保上下文处于 running：closed 时重建；其余非 running 状态 resume 并带超时校验
  private ensureWebAudioRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.webAudioCtx) {
        resolve(false)
        return
      }
      if (this.webAudioCtx.state === 'running') {
        resolve(true)
        return
      }
      if (this.webAudioCtx.state === 'closed') {
        console.warn('[playAudio] WebAudio 上下文已关闭，销毁重建')
        this.createWebAudioContextInstance(true)
        if (!this.webAudioCtx) {
          resolve(false)
          return
        }
        if (this.webAudioCtx.state === 'running') {
          resolve(true)
          return
        }
      }
      // suspended / interrupted：resume 并校验结果，超时视为失败
      this.resumeWithTimeout(this.webAudioCtx, resolve)
    })
  }

  // resume + 超时竞速：部分基础库 resume 的 Promise 永不返回，必须用超时兜底
  private resumeWithTimeout(ctx: any, resolve: (ok: boolean) => void) {
    let settled = false
    const timer = setTimeout(() => {
      console.warn('[playAudio] WebAudio resume 超时，判定失败')
      if (settled) return
      settled = true
      resolve(false)
    }, RESUME_TIMEOUT_MS)
    let ret: any
    try {
      ret = ctx.resume()
    } catch (err) {
      console.warn('[playAudio] WebAudio resume 异常，判定失败', err)
      settled = true
      clearTimeout(timer)
      resolve(false)
      return
    }
    Promise.resolve(ret).then(() => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(ctx.state === 'running')
    }).catch(() => {
      console.warn('[playAudio] WebAudio resume 异常，判定失败')
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(false)
    })
  }

  // 解码结果按路径缓存，避免每次播放重复解码（也规避真机重复解码失败）
  private loadDecodedBuffer(filePath: string): Promise<any> {
    if (this.bufferCache[filePath]) {
      return Promise.resolve(this.bufferCache[filePath])
    }
    const ctx = this.webAudioCtx
    if (!ctx) return Promise.reject(new Error('WebAudio 上下文不可用'))
    return readAudioFile(filePath)
      .then((data) => decodeAudioData(ctx, data))
      .then((buf: any) => {
        this.bufferCache[filePath] = buf
        return buf
      })
  }

  // 用合成后的单个 AudioBuffer 起播（每次都是新的 BufferSource，保证可重复播放）
  private startSource(merged: any, token: number) {
    if (token !== this.token) return
    const ctx = this.webAudioCtx
    if (!ctx) {
      this.startFallback(token)
      return
    }
    // 起播前先彻底清掉上一个节点，避免残留节点/回调影响本次播放
    this.stopSourceNode()
    this.clearEndTimer()
    this.mode = 'web'
    let source: any
    try {
      source = ctx.createBufferSource()
      source.buffer = merged
      source.connect(ctx.destination)
    } catch (err) {
      console.warn('[playAudio] 创建播放节点失败，回退分段播放', err)
      this.startFallback(token)
      return
    }
    const startTime = Date.now()
    source.onended = () => {
      if (token !== this.token || this.bufferSource !== source) return
      const playedMs = Date.now() - startTime
      if (playedMs < EARLY_END_MS) {
        // 几乎立即结束说明上下文实际未运行（resume 校验误报），回退分段播放保证有声音
        console.warn('[playAudio] onended 异常提前结束，回退分段播放')
        this.startFallback(token)
        return
      }
      console.log('[playAudio] onended，播放结束')
      this.stop()
    }
    this.bufferSource = source
    try {
      source.start()
    } catch (err) {
      console.warn('[playAudio] 起播失败，回退分段播放', err)
      this.bufferSource = null
      this.startFallback(token)
      return
    }
    this.endTimer = setTimeout(() => {
      console.log('[playAudio] endTimer 兜底停止')
      if (token === this.token) this.stop()
    }, merged.duration * 1000 + 150)
  }

  // 上下文全局只创建一次；force=true 时销毁旧实例重建（closed 等异常场景）
  private createWebAudioContextInstance(force: boolean) {
    const createWebAudioContext = (wx as any).createWebAudioContext
    if (!createWebAudioContext) {
      this.webAudioCtx = null
      return
    }
    if (force && this.webAudioCtx) {
      try { this.webAudioCtx.close() } catch (e) {}
      this.webAudioCtx = null
      // 旧上下文产出的 AudioBuffer 与新上下文可能不兼容，一并清空
      this.bufferCache = {}
      this.mergedCache = {}
    }
    if (this.webAudioCtx) return
    try {
      this.webAudioCtx = createWebAudioContext()
    } catch (err) {
      console.warn('[playAudio] 创建 WebAudio 上下文失败', err)
      this.webAudioCtx = null
      return
    }
    // 部分基础库版本创建后需主动 resume 一次
    if (this.webAudioCtx && this.webAudioCtx.state !== 'running') {
      try { Promise.resolve(this.webAudioCtx.resume()).catch(() => {}) } catch (e) {}
    }
  }

  // 合成不可用时的回退：分段依次播放
  private startFallback(token: number) {
    if (token !== this.token) return
    this.stopSourceNode()
    this.clearEndTimer()
    const ctx = this.ensureInnerAudio()
    if (!ctx) {
      console.warn('[playAudio] 无可用播放通道，结束本次播放')
      this.stop()
      return
    }
    this.mode = 'fallback'
    this.audioIndex = 0
    this.playCurrentSegment()
  }

  // InnerAudioContext 按需创建，只在回退模式下使用
  private ensureInnerAudio(): WechatMiniprogram.InnerAudioContext | null {
    if (this.innerAudio) return this.innerAudio
    try {
      const ctx = wx.createInnerAudioContext()
      // 回调内先校验模式，避免停止时触发的 onEnded / onError 影响下一次播放
      ctx.onEnded(() => this.handleSegmentEnded())
      ctx.onError(() => this.handleSegmentError())
      this.innerAudio = ctx
    } catch (err) {
      console.warn('[playAudio] 创建 InnerAudioContext 失败', err)
      this.innerAudio = null
    }
    return this.innerAudio
  }

  // 一段播完自动播下一段（仅回退模式生效）
  private handleSegmentEnded() {
    if (this.mode !== 'fallback') return
    this.audioIndex++
    this.playCurrentSegment()
  }

  private handleSegmentError() {
    if (this.mode !== 'fallback') return
    console.warn('[playAudio] 分段播放出错，结束本次播放')
    this.stop()
  }

  // 播放当前段（回退用）
  private playCurrentSegment() {
    const ctx = this.innerAudio
    if (this.mode !== 'fallback' || !ctx || this.audioIndex >= this.audioList.length) {
      this.stop()
      return
    }
    try {
      ctx.src = this.audioList[this.audioIndex]
      ctx.play()
    } catch (err) {
      console.warn('[playAudio] 分段播放异常，结束本次播放', err)
      this.stop()
    }
  }

  // 复位播放状态：先把 mode 置为 idle，再停原生对象，确保回调不会串台
  private clearPlayback() {
    this.mode = 'idle'
    this.clearEndTimer()
    this.stopSourceNode()
    this.stopInnerAudio()
    this.audioIndex = 0
  }

  private stopSourceNode() {
    const source = this.bufferSource
    this.bufferSource = null
    if (!source) return
    source.onended = null
    try { source.stop() } catch (e) {}
    try { if (source.disconnect) source.disconnect() } catch (e) {}
  }

  private stopInnerAudio() {
    if (!this.innerAudio) return
    try { this.innerAudio.stop() } catch (e) {}
  }

  private clearEndTimer() {
    if (!this.endTimer) return
    clearTimeout(this.endTimer)
    this.endTimer = null
  }

  private setPlaying(playing: boolean) {
    if (this.playing === playing) return
    this.playing = playing
    if (this.onPlayingChange) this.onPlayingChange(playing)
  }
}
