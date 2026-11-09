// subpages/shengchen/shengchen.ts
// 生辰查询：填写母亲属相与岁数、查询人出生日期与出生时辰，
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

/** 数字补零 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

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
    zodiacs: [] as ZodiacOption[],
    shichens: SHICHENS,
    motherZodiacIndex: -1,
    motherAge: 0,
    motherBirthYear: 0,
    motherMeta: '',
    years: [] as number[],
    months: [] as number[],
    days: [] as number[],
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
    draftDateValue: [0, 0, 0] as number[],
    showTimeSheet: false,
    draftShichenIndex: -1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    const months: number[] = []
    for (let m = 1; m <= 12; m++) months.push(m)
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] })),
      years: this.buildYears(),
      months
    })
  },

  /** 按属相列出今年可选虚岁 */
  agesOf(zodiacIndex: number): number[] {
    if (zodiacIndex < 0) return []
    return getYiAge(ZODIAC_CN[zodiacIndex])
  },

  /** 某年某月的天数（month 为 1-12） */
  daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
  },

  /** 构建某年某月的日数组 */
  buildDays(year: number, month: number): number[] {
    const days: number[] = []
    for (let d = 1; d <= this.daysInMonth(year, month); d++) days.push(d)
    return days
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

  /** 出生日期可选年份：从母亲出生年份后 10 年起，到今年 */
  buildYears(): number[] {
    const { motherBirthYear } = this.data
    const minYear = motherBirthYear > 0 ? Math.max(1900, motherBirthYear + 10) : 1900
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = minYear; y <= currentYear; y++) years.push(y)
    return years
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
      motherMeta: `${ZODIAC[draftZodiacIndex]} ${ZODIAC_CN[draftZodiacIndex]}属 · ${draftAge}岁 · ${motherBirthYear}年生`,
      canQuery: this.readyToQuery(draftZodiacIndex, draftAge, motherBirthYear, birthDate, birthTime)
    })
  },

  /** 打开出生日期弹层：限定可选年份（晚于母亲出生年份 10 年），未选则今天 */
  openDateSheet() {
    const { birthDate } = this.data
    const years = this.buildYears()
    const now = new Date()
    let y = now.getFullYear()
    let m = now.getMonth() + 1
    let d = now.getDate()
    if (birthDate) {
      const parts = birthDate.split('-').map(Number)
      y = parts[0]
      m = parts[1]
      d = parts[2]
    }
    if (y < years[0]) y = years[0]
    if (y > years[years.length - 1]) y = years[years.length - 1]
    this.setData({
      showDateSheet: true,
      years,
      draftDateValue: [years.indexOf(y), m - 1, Math.min(d, this.daysInMonth(y, m)) - 1],
      days: this.buildDays(y, m)
    })
  },

  /** 关闭出生日期弹层 */
  closeDateSheet() {
    this.setData({ showDateSheet: false })
  },

  /** 弹层内滚动年/月/日：年或月变化时按实际天数刷新日列 */
  onDraftDateChange(e: WechatMiniprogram.CustomEvent<{ value: number[] }>) {
    const value = (e.detail.value || []).map(Number)
    const prev = this.data.draftDateValue
    const changed = value[0] !== prev[0] || value[1] !== prev[1]
    const days = changed
      ? this.buildDays(this.data.years[value[0]], value[1] + 1)
      : this.data.days
    this.setData({
      draftDateValue: [value[0], value[1], Math.min(value[2], days.length - 1)],
      days
    })
  },

  /** 确认出生日期 */
  confirmDate() {
    const { draftDateValue, years, motherZodiacIndex, motherAge, motherBirthYear, birthTime } = this.data
    const [yi, mi, di] = draftDateValue
    const y = years[yi]
    const m = mi + 1
    const d = di + 1
    const birthDate = `${y}-${pad2(m)}-${pad2(d)}`
    this.setData({
      showDateSheet: false,
      birthDate,
      birthDateText: `${y}年${m}月${d}日`,
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
      title: '彝族生活日历 · 生辰查询',
      path: '/pages/index/index'
    }
  }
})
