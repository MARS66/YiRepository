// utils/playAudio.ts
// 音频播放逻辑：输入日期，读取对应的 5 段彝历语音素材（年/月/日/月相/塔博），
// 裁掉首尾静音后合成为一个完整音频播放；合成不可用时自动回退为分段播放。
//
// WebAudio 采用官方推荐的用法：上下文全局只创建一次，每次播放新建 BufferSourceNode。
// 针对真机稳定性做了以下加固：
//  - 上下文在用户点击手势内首次创建（保证 resume 成功率高）
//  - resume 带超时竞速（部分基础库 resume 的 Promise 永不返回，超时即回退，避免静默无反应）
//  - 上下文 closed 时强制销毁重建（同时清空解码/合成缓存）
//  - 合成结果按素材列表缓存，二次播放秒开
//  - onended 异常提前结束（实际未播起来）时回退分段播放，保证每次点击都有声音
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

export class YiAudioPlayer {
  // 注意：小程序 JS 引擎不支持 class 字段语法，字段只在构造函数中赋值
  private audioCtx!: WechatMiniprogram.InnerAudioContext | null
  private audioList!: string[]
  private audioIndex!: number
  private webAudioCtx!: any
  private bufferSource!: any
  private bufferCache!: { [path: string]: any }
  private mergedCache!: { [key: string]: any }
  private endTimer!: ReturnType<typeof setTimeout> | null
  private playToken!: number
  private playing!: boolean
  private onPlayingChange?: (playing: boolean) => void

  constructor(options?: YiAudioPlayerOptions) {
    this.onPlayingChange = options ? options.onPlayingChange : undefined
    this.audioCtx = null
    this.audioList = []
    this.audioIndex = 0
    this.webAudioCtx = null
    this.bufferSource = null
    this.bufferCache = {}
    this.mergedCache = {}
    this.endTimer = null
    this.playToken = 0
    this.playing = false
    this.audioCtx = wx.createInnerAudioContext()
    this.audioCtx.onEnded(() => this.playNextSegment())
    this.audioCtx.onError(() => this.stop())
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
      console.log('[playAudio] 播放中，忽略本次调用')
      this.stop()
      return
    }
    const yiDate = getYiTaBoo(dateStr)
    const { yearZodiacIndex, monthZodiacIndex, dayZodiacIndex, dayIndex, tabooIndex } = yiDate
    this.audioList = [
      `/static/Audio/year/${yearZodiacIndex}.m4a`,
      `/static/Audio/month/${monthZodiacIndex}.m4a`,
      `/static/Audio/zoday/${dayZodiacIndex}.m4a`,
      `/static/Audio/moon/${dayIndex}.m4a`,
      `/static/Audio/tabo/${tabooIndex}.m4a`,
    ]
    console.log('[playAudio] play', dateStr)
    // WebAudio 上下文在用户点击手势内首次创建（只创建一次）
    this.createWebAudioContextInstance(false)
    this.setPlaying(true)
    this.playMergedAudio(this.audioList, ++this.playToken)
  }

  /** 停止播放并重置 */
  stop() {
    this.playToken++
    if (this.audioCtx) {
      this.audioCtx.stop()
    }
    if (this.bufferSource) {
      try { this.bufferSource.stop() } catch (e) {}
      if (this.bufferSource.disconnect) this.bufferSource.disconnect()
      this.bufferSource.onended = null
      this.bufferSource = null
    }
    if (this.endTimer) {
      clearTimeout(this.endTimer)
      this.endTimer = null
    }
    this.audioIndex = 0
    this.audioList = []
    this.setPlaying(false)
  }

  /** 释放资源（页面卸载时调用） */
  destroy() {
    this.stop()
    if (this.audioCtx) {
      this.audioCtx.destroy()
      this.audioCtx = null
    }
    if (this.webAudioCtx) {
      try { this.webAudioCtx.close() } catch (e) {}
      this.webAudioCtx = null
    }
  }

  // 读取 5 段素材 → 解码(带缓存) → 裁静音 → 合成一个 AudioBuffer 播放
  private playMergedAudio(files: string[], token: number) {
    if (!this.webAudioCtx) {
      console.warn('[playAudio] WebAudio 不可用，回退分段播放')
      this.fallbackPlay()
      return
    }
    const cacheKey = files.join('|')
    this.ensureWebAudioRunning().then((ok: boolean) => {
      if (token !== this.playToken) return
      if (!ok) {
        console.warn('[playAudio] WebAudio resume 失败/超时，回退分段播放')
        this.fallbackPlay()
        return
      }
      const ctx = this.webAudioCtx
      const cached = this.mergedCache[cacheKey]
      if (cached) {
        console.log('[playAudio] 命中合成缓存，直接播放')
        this.startSource(ctx, cached, token)
        return
      }
      Promise.all(files.map(filePath => this.loadDecodedBuffer(ctx, filePath)))
        .then((buffers: any[]) => {
          if (token !== this.playToken) return
          const merged = mergeAudioBuffers(ctx, buffers)
          if (!merged) {
            console.warn('[playAudio] 合成失败，回退分段播放')
            this.fallbackPlay()
            return
          }
          this.mergedCache[cacheKey] = merged
          this.startSource(ctx, merged, token)
        })
        .catch((err: any) => {
          console.warn('[playAudio] 解码失败，回退分段播放', err)
          if (token === this.playToken) this.fallbackPlay()
        })
    }).catch((err: any) => {
      console.warn('[playAudio] WebAudio 启动异常，回退分段播放', err)
      if (token === this.playToken) this.fallbackPlay()
    })
  }

  // 确保上下文处于 running：closed 时强制重建；suspended 时 resume 并带超时校验
  private ensureWebAudioRunning(): Promise<boolean> {
    return new Promise((resolve) => {
      const ctx = this.webAudioCtx
      if (!ctx) {
        resolve(false)
        return
      }
      if (ctx.state === 'running') {
        resolve(true)
        return
      }
      if (ctx.state === 'closed') {
        console.warn('[playAudio] WebAudio 上下文已关闭，销毁重建')
        this.createWebAudioContextInstance(true)
        const newCtx = this.webAudioCtx
        if (!newCtx || newCtx.state === 'closed') {
          resolve(false)
          return
        }
        if (newCtx.state === 'running') {
          resolve(true)
          return
        }
        this.resumeWithTimeout(newCtx, resolve)
        return
      }
      // suspended：resume 并校验结果，超时视为失败
      this.resumeWithTimeout(ctx, resolve)
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
    ctx.resume().then(() => {
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
  private loadDecodedBuffer(ctx: any, filePath: string): Promise<any> {
    if (this.bufferCache[filePath]) {
      return Promise.resolve(this.bufferCache[filePath])
    }
    return readAudioFile(filePath)
      .then(data => decodeAudioData(ctx, data))
      .then((buf: any) => {
        this.bufferCache[filePath] = buf
        return buf
      })
  }

  // 用合成后的单个 AudioBuffer 起播
  private startSource(ctx: any, merged: any, token: number) {
    if (token !== this.playToken) return
    this.bufferSource = ctx.createBufferSource()
    this.bufferSource.buffer = merged
    this.bufferSource.connect(ctx.destination)
    const startTime = Date.now()
    this.bufferSource.onended = () => {
      const playedMs = Date.now() - startTime
      if (token !== this.playToken) return
      if (playedMs < EARLY_END_MS) {
        // 几乎立即结束说明上下文实际未运行（校验误报），回退分段播放保证有声音
        console.warn('[playAudio] onended 异常提前结束，回退分段播放')
        if (this.endTimer) {
          clearTimeout(this.endTimer)
          this.endTimer = null
        }
        this.fallbackPlay()
        return
      }
      console.log('[playAudio] onended，播放结束')
      this.stop()
    }
    this.bufferSource.start()
    this.endTimer = setTimeout(() => {
      console.log('[playAudio] endTimer 兜底停止')
      if (token === this.playToken) this.stop()
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
    this.webAudioCtx = createWebAudioContext()
    // 部分基础库版本创建后需主动 resume 一次
    if (this.webAudioCtx && this.webAudioCtx.state === 'suspended') {
      this.webAudioCtx.resume().catch(() => {})
    }
  }

  // 合成不可用时的回退：分段依次播放
  private fallbackPlay() {
    if (!this.audioCtx) {
      this.stop()
      return
    }
    this.audioIndex = 0
    this.playCurrentSegment()
  }

  // 播放当前段（回退用）
  private playCurrentSegment() {
    if (!this.audioCtx || this.audioIndex >= this.audioList.length) {
      this.stop()
      return
    }
    this.audioCtx.src = this.audioList[this.audioIndex]
    this.audioCtx.play()
  }

  // 一段播完自动播下一段（回退用）
  private playNextSegment() {
    this.audioIndex++
    this.playCurrentSegment()
  }

  private setPlaying(playing: boolean) {
    if (this.playing === playing) return
    this.playing = playing
    if (this.onPlayingChange) this.onPlayingChange(playing)
  }
}
