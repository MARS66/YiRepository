// utils/settings.ts
// 「我的」页面设置项统一存取：音频播放模式、彝历起始月份。
// 全部写入本地 Storage，保证离线可用，且各页面读取同一份配置。

export type AudioMode = 'auto' | 'manual'

const AUDIO_KEY = 'yi-audio-mode'
const MONTH_KEY = 'yi-month-start'

/** 音频播放模式，默认自动播放 */
export function getAudioMode(): AudioMode {
  return wx.getStorageSync(AUDIO_KEY) === 'manual' ? 'manual' : 'auto'
}

/** 保存音频播放模式 */
export function setAudioMode(mode: AudioMode) {
  wx.setStorageSync(AUDIO_KEY, mode)
}

/** 是否自动播放 */
export function isAutoAudio(): boolean {
  return getAudioMode()  === 'auto'
}

/** 彝历正月对应的属相下标，默认 6（马月为正月） */
export function getMonthStartIndex(): number {
  const value = wx.getStorageSync(MONTH_KEY)
  if (typeof value !== 'number' || value < 0 || value > 11) return 6
  return value
}

/** 保存彝历正月对应的属相下标 */
export function setMonthStartIndex(index: number) {
  wx.setStorageSync(MONTH_KEY, index)
}
