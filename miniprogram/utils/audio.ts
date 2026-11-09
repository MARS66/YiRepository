/**
 * 音频播放工具：单字读音 + 彝语词组合成播放
 * （多字拼接：去静音 + 音量归一 + 词间停顿 + 边界淡入淡出，使拼接自然连贯）。
 * 供学习/回顾/详情等页面共用。
 */
import { wordAudioMap } from './wordAudioMap'

let wordAudioCtx: WechatMiniprogram.InnerAudioContext | null = null
let phraseAudioCtx: WechatMiniprogram.InnerAudioContext | null = null
let phraseBusy = false
const BaseUrl = 'https://wordsound.yixueyanjiu.com/liangshan_'
const phraseCache = new Map<string, string>()
const PHRASE_GAP_MS = 60 // 词间固定自然停顿，避免字与字贴得过紧
const PHRASE_FADE_MS = 25 // 词首尾淡入淡出，消除拼接接缝的波形突变
const PHRASE_PEAK = 0.9 // 峰值归一化目标，统一各单字音量



function stripMp3Tags(buf: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(buf)
  let start = 0
  let end = bytes.length
  if (bytes.length > 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f)
    start = 10 + size
  }
  if (end - start > 128 && bytes[end - 128] === 0x54 && bytes[end - 127] === 0x41 && bytes[end - 126] === 0x47) {
    end -= 128
  }
  if (start === 0 && end === bytes.length) return buf
  return bytes.slice(start, end).buffer
}

function concatBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const b of buffers) {
    merged.set(new Uint8Array(b), offset)
    offset += b.byteLength
  }
  return merged.buffer
}

function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.tempFilePath)
        else reject(new Error('download status ' + res.statusCode))
      },
      fail: reject,
    })
  })
}

function readFileBuffer(filePath: string): Promise<ArrayBuffer> {
  const fs = wx.getFileSystemManager()
  return new Promise((resolve, reject) => {
    fs.readFile({ filePath, success: (res) => resolve(res.data as ArrayBuffer), fail: reject })
  })
}

function playUrl(url: string): void {
  if (!wordAudioCtx) {
    wordAudioCtx = wx.createInnerAudioContext()
    wordAudioCtx.obeyMuteSwitch = false
    wordAudioCtx.onError(() => {
      wx.showToast({ title: '音频播放失败，请检查网络', icon: 'none' })
    })
  }
  if (phraseAudioCtx) phraseAudioCtx.stop()
  wordAudioCtx.stop()
  wordAudioCtx.src = url
  wordAudioCtx.play()
}

function playLocalPath(path: string): void {
  if (!phraseAudioCtx) {
    phraseAudioCtx = wx.createInnerAudioContext()
    phraseAudioCtx.obeyMuteSwitch = false
    phraseAudioCtx.onError(() => {
      wx.showToast({ title: '音频播放失败，请检查网络', icon: 'none' })
    })
  }
  if (wordAudioCtx) wordAudioCtx.stop()
  phraseAudioCtx.stop()
  phraseAudioCtx.src = path
  phraseAudioCtx.play()
}

interface DecodedSegment {
  channel: Float32Array
  sampleRate: number
}

interface WebAudioBufferLike {
  numberOfChannels: number
  sampleRate: number
  getChannelData(channel: number): Float32Array
}

interface WebAudioContextLike {
  decodeAudioData(
    data: ArrayBuffer,
    success: (buffer: WebAudioBufferLike) => void,
    fail?: (err: unknown) => void
  ): void
}

function createWebAudio(): WebAudioContextLike | null {
  try {
    const anyWx = wx as unknown as { createWebAudioContext?: () => WebAudioContextLike }
    if (typeof anyWx.createWebAudioContext === 'function') return anyWx.createWebAudioContext()
  } catch (e) {
    /* 低版本基础库不支持时回退到 MP3 直接拼接 */
  }
  return null
}

function decodeSegment(audio: WebAudioContextLike, buf: ArrayBuffer): Promise<DecodedSegment> {
  return new Promise((resolve, reject) => {
    audio.decodeAudioData(
      buf.slice(0),
      (buffer) => {
        const channel = new Float32Array(buffer.getChannelData(0))
        resolve({ channel, sampleRate: buffer.sampleRate })
      },
      reject
    )
  })
}

function trimSilence(channel: Float32Array, sampleRate: number): Float32Array {
  const THRESHOLD = 0.01
  let start = -1
  let end = -1
  for (let i = 0; i < channel.length; i++) {
    if (Math.abs(channel[i]) > THRESHOLD) {
      start = i
      break
    }
  }
  for (let i = channel.length - 1; i >= 0; i--) {
    if (Math.abs(channel[i]) > THRESHOLD) {
      end = i + 1
      break
    }
  }
  if (start < 0 || end <= start) return channel
  const margin = Math.round((20 / 1000) * sampleRate)
  return channel.subarray(Math.max(0, start - margin), Math.min(channel.length, end + margin))
}

function resampleTo(channel: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return channel
  const out = new Float32Array(Math.max(1, Math.round((channel.length * to) / from)))
  const ratio = from / to
  for (let i = 0; i < out.length; i++) {
    const pos = i * ratio
    const i0 = Math.floor(pos)
    const i1 = Math.min(channel.length - 1, i0 + 1)
    const frac = pos - i0
    out[i] = channel[i0] * (1 - frac) + channel[i1] * frac
  }
  return out
}

function encodeWav(channel: Float32Array, sampleRate: number): ArrayBuffer {
  const numSamples = channel.length
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, channel[i]))
    view.setInt16(offset, s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff), true)
    offset += 2
  }
  return buffer
}

function normalizePeak(channel: Float32Array, target: number): Float32Array {
  let peak = 0
  for (let i = 0; i < channel.length; i++) {
    const v = Math.abs(channel[i])
    if (v > peak) peak = v
  }
  if (peak <= 0) return channel
  const gain = target / peak
  if (gain > 0.999 && gain < 1.001) return channel
  const out = new Float32Array(channel.length)
  for (let i = 0; i < channel.length; i++) out[i] = channel[i] * gain
  return out
}

function applyEdgeFades(channel: Float32Array, sampleRate: number, fadeMs: number): Float32Array {
  const n = Math.min(channel.length, Math.round((fadeMs / 1000) * sampleRate))
  if (n < 2) return channel
  const out = channel.slice()
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const g = t * t
    out[i] *= g
    out[out.length - 1 - i] *= g
  }
  return out
}

function writeFileBuffer(filePath: string, data: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().writeFile({
      filePath,
      data,
      success: () => resolve(filePath),
      fail: reject,
    })
  })
}

function buildTrimmedWav(audio: WebAudioContextLike, urls: string[]): Promise<string> {
  return Promise.all(urls.map(downloadFile))
    .then((paths) => Promise.all(paths.map(readFileBuffer)))
    .then((buffers) => Promise.all(buffers.map((b) => decodeSegment(audio, b))))
    .then((segments) => {
      const sampleRate = segments[0].sampleRate
      const gapLen = Math.round((PHRASE_GAP_MS / 1000) * sampleRate)
      const parts = segments.map((s) => {
        let ch = resampleTo(s.channel, s.sampleRate, sampleRate)
        ch = trimSilence(ch, sampleRate)
        ch = normalizePeak(ch, PHRASE_PEAK)
        return applyEdgeFades(ch, sampleRate, PHRASE_FADE_MS)
      })
      let total = 0
      for (let i = 0; i < parts.length; i++) {
        total += parts[i].length
        if (i < parts.length - 1) total += gapLen
      }
      const merged = new Float32Array(total)
      let offset = 0
      for (let i = 0; i < parts.length; i++) {
        merged.set(parts[i], offset)
        offset += parts[i].length
        if (i < parts.length - 1) offset += gapLen
      }
      return writeFileBuffer(`${wx.env.USER_DATA_PATH}/phrase_${Date.now()}.wav`, encodeWav(merged, sampleRate))
    })
}

function buildJoinedMp3(urls: string[]): Promise<string> {
  return Promise.all(urls.map(downloadFile))
    .then((paths) => Promise.all(paths.map(readFileBuffer)))
    .then((buffers) => {
      const merged = concatBuffers(buffers.map(stripMp3Tags))
      return writeFileBuffer(`${wx.env.USER_DATA_PATH}/phrase_${Date.now()}.mp3`, merged)
    })
}

function playJoinedAudio(yiText: string, urls: string[]): void {
  if (phraseBusy) return
  const cached = phraseCache.get(yiText)
  if (cached) {
    playLocalPath(cached)
    return
  }
  phraseBusy = true
  const audio = createWebAudio()
  const task = audio ? buildTrimmedWav(audio, urls) : buildJoinedMp3(urls)
  task
    .then((dest) => {
      phraseCache.set(yiText, dest)
      playLocalPath(dest)
    })
    .catch(() => {
      wx.showToast({ title: '词组音频生成失败，请稍后重试', icon: 'none' })
    })
    .finally(() => {
      phraseBusy = false
    })
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

/** 点击轻震反馈：播放前先给用户触觉反馈，避免处理延迟期间重复点击 */
function vibrateFeedback(): void {
  try {
    wx.vibrateShort({ type: 'light', fail: () => {} })
  } catch (e) {
    /* 低版本基础库不支持震动时忽略 */
  }
}

/** 播放单个文字读音 */
export function playWordAudio(url: string): void {
  if (!url) return
  vibrateFeedback()
  playUrl(url)
}

/** 播放彝语词组读音（多字时下载并拼接音频） */
export function playPhraseAudio(yi: string): void {
  const urls: string[] = []
  for (const c of Array.from(yi)) {
    const u = wordAudioMap.get(c)
    if (u) urls.push(`${BaseUrl}${u}.mp3`)
  }
  if (urls.length === 0) return
  vibrateFeedback()
  if (urls.length === 1) {
    playUrl(urls[0])
    return
  }
  playJoinedAudio(yi, urls)
}

/** 从词组列表中随机抽取一条 */
export function pickPhrases(phrases: { yi: string; han: string }[] | undefined): { yi: string; han: string } | null {
  if (!phrases || phrases.length === 0) return null
  return shuffle(phrases)[0] || null
}