/**
 * 音频播放工具：单字读音 + 彝语词组合成播放（多字去静音拼接）。
 * 供学习/回顾/详情等页面共用。
 */
import { wordAudioMap } from './wordAudioMap'

let wordAudioCtx: WechatMiniprogram.InnerAudioContext | null = null
let phraseAudioCtx: WechatMiniprogram.InnerAudioContext | null = null
let phraseBusy = false
const BaseUrl = 'https://wordsound.yixueyanjiu.com/liangshan_'
const phraseCache = new Map<string, string>()



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
      const trimmed = segments.map((s) => {
        const ch = resampleTo(s.channel, s.sampleRate, sampleRate)
        return trimSilence(ch, sampleRate)
      })
      let total = 0
      for (const t of trimmed) total += t.length
      const merged = new Float32Array(total)
      let offset = 0
      for (const t of trimmed) {
        merged.set(t, offset)
        offset += t.length
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

/** 播放单个文字读音 */
export function playWordAudio(url: string): void {
  if (!url) return
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
  if (urls.length === 1) {
    playUrl(urls[0])
    return
  }
  playJoinedAudio(yi, urls)
}

/** 从词组列表中随机抽取一条 */
export function pickPhrases(phrases: { yi: string; han: string }[] | undefined): { yi: string; han: string } | null {
  if (!phrases || phrases.length === 0) return null
  return shuffle(phrases)[0] ?? null
}