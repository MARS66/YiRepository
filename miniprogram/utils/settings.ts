// utils/settings.ts
// 「我的」页面设置项统一存取：常用人员、音频播放模式、彝历起始月份。
// 全部写入本地 Storage，保证离线可用，且各页面读取同一份配置。

export interface MemberRecord {
  /** 唯一标识 */
  id: string
  /** 称呼 */
  name: string
  /** 属相在 ZODIAC_CN 中的下标 0-11 */
  zodiacIndex: number
  /** 出生年份（农历年，用于按年自动推算虚岁） */
  birthYear: number
  /** 永恒西德方位在 DIRECTION 中的下标 0-7，-1 表示未设置 */
  directionIndex: number
}

export type AudioMode = 'auto' | 'manual'

const MEMBERS_KEY = 'yi-members'
const AUDIO_KEY = 'yi-audio-mode'
const MONTH_KEY = 'yi-month-start'

/** 读取常用人员列表 */
export function getMembers(): MemberRecord[] {
  const value = wx.getStorageSync(MEMBERS_KEY)
  return Array.isArray(value) ? value : []
}

/** 保存常用人员列表 */
export function saveMembers(members: MemberRecord[]) {
  wx.setStorageSync(MEMBERS_KEY, members)
}

/** 音频播放模式，默认手动播放 */
export function getAudioMode(): AudioMode {
  return wx.getStorageSync(AUDIO_KEY) === 'auto' ? 'auto' : 'manual'
}

/** 保存音频播放模式 */
export function setAudioMode(mode: AudioMode) {
  wx.setStorageSync(AUDIO_KEY, mode)
}

/** 是否自动播放 */
export function isAutoAudio(): boolean {
  return getAudioMode() === 'auto'
}

/** 彝历正月对应的属相下标，默认 0（鼠月为正月） */
export function getMonthStartIndex(): number {
  const value = wx.getStorageSync(MONTH_KEY)
  if (typeof value !== 'number' || value < 0 || value > 11) return 0
  return value
}

/** 保存彝历正月对应的属相下标 */
export function setMonthStartIndex(index: number) {
  wx.setStorageSync(MONTH_KEY, index)
}
