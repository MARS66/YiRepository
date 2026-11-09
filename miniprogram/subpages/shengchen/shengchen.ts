// subpages/shengchen/shengchen.ts
// 生辰推算：填写母亲属相与岁数、查询人出生日期与出生时辰，
// 点击「查询生辰」进入结果页查看出生时的彝历、农历与八字。
import { ZODIAC, ZODIAC_CN, getYiAge } from '../../plugin/yi-lunar/index'
import { Lunar } from '../libs/lunar-typescript'

interface ZodiacOption {
  cn: string
  yi: string
}

/** 十二时辰：名称、时段与用于八字推算的代表时间 */
interface ShichenOption {
  name: string
  range: string
  time: string
}

const SHICHENS: ShichenOption[] = [
  { name: '子时', range: '23:00-01:00', time: '00:00' },
  { name: '丑时', range: '01:00-03:00', time: '02:00' },
  { name: '寅时', range: '03:00-05:00', time: '04:00' },
  { name: '卯时', range: '05:00-07:00', time: '06:00' },
  { name: '辰时', range: '07:00-09:00', time: '08:00' },
  { name: '巳时', range: '09:00-11:00', time: '10:00' },
  { name: '午时', range: '11:00-13:00', time: '12:00' },
  { name: '未时', range: '13:00-15:00', time: '14:00' },
  { name: '申时', range: '15:00-17:00', time: '16:00' },
  { name: '酉时', range: '17:00-19:00', time: '18:00' },
  { name: '戌时', range: '19:00-21:00', time: '20:00' },
  { name: '亥时', range: '21:00-23:00', time: '22:00' }
]

/** 当前农历年 */
function currentLunarYear(): number {
  return Lunar.fromDate(new Date()).getYear()
}

/** 由彝族虚岁倒推母亲出生年份：出生即 1 岁，每年农历正月初一增一岁 */
function motherBirthYearOf(age: number): number {
  return currentLunarYear() - age + 1
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    zodiacs: [] as ZodiacOption[],
    shichens: SHICHENS,
    motherZodiacIndex: -1,
    motherAge: 0,
    motherBirthYear: 0,
    motherMeta: '',
    minBirthYear: 1900,
    birthDate: '',
    birthDateText: '',
    birthShichenIndex: -1,
    birthTime: '',
    birthTimeMeta: '',
    canQuery: false,
    showEditor: false,
    draftZodiacIndex: -1,
    draftAge: 0,
    draftAges: [] as number[],
    draftCanSave: false,
    showDateSheet: false,
    showTimeSheet: false,
    draftShichenIndex: -1
  },

  /**
   * 主题切换（由 layout 组件触发）：同步 isDark，用于 page-meta 背景色
   */
  onThemeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ isDark: e.detail.isDark })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] }))
    })
  },

  /** 按属相列出今年可选虚岁 */
  agesOf(zodiacIndex: number): number[] {
    if (zodiacIndex < 0) return []
    return getYiAge(ZODIAC_CN[zodiacIndex])
  },

  /** 四项条件是否齐备（含出生日期晚于母亲出生年份 10 年的约束） */
  readyToQuery(
    motherZodiacIndex: number,
    motherAge: number,
    motherBirthYear: number,
    birthDate: string,
    birthTime: string
  ): boolean {
    if (
      motherZodiacIndex < 0
      || motherAge <= 0
      || birthDate.length === 0
      || birthTime.length === 0
    ) {
      return false
    }
    const birthYear = Number(birthDate.split('-')[0])
    return motherBirthYear <= 0 || birthYear >= motherBirthYear + 10
  },

  /** 打开母亲信息弹层 */
  openMother() {
    const { motherZodiacIndex, motherAge } = this.data
    this.setData({
      showEditor: true,
      draftZodiacIndex: motherZodiacIndex,
      draftAge: motherAge,
      draftAges: this.agesOf(motherZodiacIndex),
      draftCanSave: motherZodiacIndex >= 0 && motherAge > 0
    })
  },

  /** 关闭弹层 */
  closeEditor() {
    this.setData({ showEditor: false })
  },

  /** 阻止弹层内的滑动穿透 */
  noop() {},

  /** 弹层内选择属相：刷新可选岁数 */
  onDraftZodiacSelect(e: WechatMiniprogram.TouchEvent) {
    const draftZodiacIndex = Number(e.currentTarget.dataset.index)
    this.setData({
      draftZodiacIndex,
      draftAges: this.agesOf(draftZodiacIndex),
      draftAge: 0,
      draftCanSave: false
    })
  },

  /** 弹层内选择岁数 */
  onDraftAgeSelect(e: WechatMiniprogram.TouchEvent) {
    const draftAge = Number(e.currentTarget.dataset.age)
    this.setData({
      draftAge,
      draftCanSave: this.data.draftZodiacIndex >= 0 && draftAge > 0
    })
  },

  /** 确认母亲信息：按彝族虚岁倒推并保存母亲出生年份 */
  confirmMother() {
    const { draftZodiacIndex, draftAge, birthDate, birthTime } = this.data
    if (draftZodiacIndex < 0 || draftAge <= 0) {
      wx.showToast({ title: '请选择母亲属相与岁数', icon: 'none' })
      return
    }
    const motherBirthYear = motherBirthYearOf(draftAge)
    this.setData({
      showEditor: false,
      motherZodiacIndex: draftZodiacIndex,
      motherAge: draftAge,
      motherBirthYear,
      minBirthYear: motherBirthYear > 0 ? Math.max(1900, motherBirthYear + 10) : 1900,
      motherMeta: `${ZODIAC[draftZodiacIndex]} ${ZODIAC_CN[draftZodiacIndex]}属 · ${draftAge}岁 · ${motherBirthYear}年生`,
      canQuery: this.readyToQuery(draftZodiacIndex, draftAge, motherBirthYear, birthDate, birthTime)
    })
  },

  /** 打开出生日期弹层：可选年份由 date-picker 组件按 minBirthYear 限制 */
  openDateSheet() {
    this.setData({ showDateSheet: true })
  },

  /** 关闭出生日期弹层 */
  closeDateSheet() {
    this.setData({ showDateSheet: false })
  },

  /** 确认出生日期 */
  onDateConfirm(e: WechatMiniprogram.CustomEvent<{ date: string }>) {
    const birthDate = e.detail.date
    const parts = birthDate.split('-').map(Number)
    const { motherZodiacIndex, motherAge, motherBirthYear, birthTime } = this.data
    this.setData({
      showDateSheet: false,
      birthDate,
      birthDateText: `${parts[0]}年${parts[1]}月${parts[2]}日`,
      canQuery: this.readyToQuery(motherZodiacIndex, motherAge, motherBirthYear, birthDate, birthTime)
    })
  },

  /** 打开出生时辰弹层 */
  openTimeSheet() {
    this.setData({
      showTimeSheet: true,
      draftShichenIndex: this.data.birthShichenIndex
    })
  },

  /** 关闭出生时辰弹层 */
  closeTimeSheet() {
    this.setData({ showTimeSheet: false })
  },

  /** 弹层内选择时辰 */
  onDraftShichenSelect(e: WechatMiniprogram.TouchEvent) {
    this.setData({ draftShichenIndex: Number(e.currentTarget.dataset.index) })
  },

  /** 确认出生时辰 */
  confirmShichen() {
    const { draftShichenIndex, motherZodiacIndex, motherAge, motherBirthYear, birthDate } = this.data
    if (draftShichenIndex < 0) {
      wx.showToast({ title: '请选择出生时辰', icon: 'none' })
      return
    }
    const item = SHICHENS[draftShichenIndex]
    this.setData({
      showTimeSheet: false,
      birthShichenIndex: draftShichenIndex,
      birthTime: item.time,
      birthTimeMeta: `${item.name} · ${item.range}`,
      canQuery: this.readyToQuery(motherZodiacIndex, motherAge, motherBirthYear, birthDate, item.time)
    })
  },

  /** 开始查询：携带母亲与出生信息进入结果页 */
  startQuery() {
    const { motherZodiacIndex, motherAge, motherBirthYear, birthDate, birthTime, canQuery } = this.data

    if (!canQuery) {
      if (motherZodiacIndex < 0 || motherAge <= 0) {
        wx.showToast({ title: '请填写母亲属相与岁数', icon: 'none' })
      } else if (!birthDate) {
        wx.showToast({ title: '请选择出生日期', icon: 'none' })
      } else if (!birthTime) {
        wx.showToast({ title: '请选择出生时辰', icon: 'none' })
      } else {
        wx.showToast({ title: `出生日期需晚于母亲出生年份 ${motherBirthYear + 10} 年`, icon: 'none' })
      }
      return
    }

    wx.navigateTo({
      url: `/subpages/shengchen/result/result?by=${motherBirthYear}&date=${birthDate}&time=${birthTime}`
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '彝族生活日历 · 生辰推算',
      path: '/pages/index/index'
    }
  }
})
