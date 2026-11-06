// pages/zeri/result/result.ts
// 择日结果：日历中标出每日吉凶，点击日期查看当日彝历与综合吉凶原因。
import {
  getHouseBuild,
  getKujior,
  getLaSe,
  getYiTaBoo,
  getZeTa,
  ZODIAC_CN
} from '../../../pages/yi-lunar/index'
import { getMonthStartIndex } from '../../../utils/settings'
import {
  evaluateDay,
  findEvent,
  ZeriEventKey,
  ZeriGender,
  ZeriLevel,
  ZeriPerson
} from '../../../utils/zeri'

interface CalendarMark {
  year: number
  month: number
  day: number
  type: 'festival' | 'corner' | 'solar'
  text: string
  style?: string
}

/** 吉凶等级对应的样式类 */
const LEVEL_CLASS: Record<ZeriLevel, string> = {
  吉: 'good',
  平: 'plain',
  凶: 'bad',
  忌: 'avoid'
}

/** 日历标记颜色（浅色 / 深色） */
const LEVEL_TONE: Record<ZeriLevel, { light: string; dark: string }> = {
  吉: { light: '#427553', dark: '#84b898' },
  平: { light: '#70695e', dark: '#bdb4a6' },
  凶: { light: '#b74d36', dark: '#e08a6e' },
  忌: { light: '#9c2d25', dark: '#e05a50' }
}

/** 吉凶等级缓存：避免切换主题或重复切月时重复计算同一天 */
const levelCache = new Map<string, ZeriLevel>()
const LEVEL_CACHE_LIMIT = 200

/** 格式化为 YYYY-MM-DD */
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 取某天的吉凶等级，带缓存 */
function levelOf(
  dateStr: string,
  person: ZeriPerson,
  eventKey: ZeriEventKey,
  monthStart: number
): ZeriLevel {
  const key = `${eventKey}|${person.zodiacIndex}|${person.age}|${person.gender}|${monthStart}|${dateStr}`
  const cached = levelCache.get(key)
  if (cached) return cached
  const level = evaluateDay(dateStr, person, eventKey, monthStart).level
  if (levelCache.size >= LEVEL_CACHE_LIMIT) levelCache.clear()
  levelCache.set(key, level)
  return level
}

/** 最近一次渲染的日期范围，主题切换时用于重建标记 */
let lastRange: Array<{ year: number; month: number; day: number }> = []

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDark: false,
    calendarAreas: ['header', 'title', 'subinfo', 'viewbar', 'dragbar', 'today'],
    calendarStyle: 'width: 100%; --wc-primary: #9c2d25; --wc-bg-light: #fffdf7; --wc-title-color-light: #201d18; --wc-title-size: 40rpx; --wc-week-color-light: #70695e; --wc-week-size: 20rpx; --wc-date-color-light: #201d18; --wc-date-size: 32rpx; --wc-today-color-light: #9c2d25; --wc-solar-color-light: #aa7b2d; --wc-mark-color-light: #201d18ca; --wc-mark-size: 22rpx; --wc-corner-size: 12rpx; --wc-checked-bg-light: radial-gradient(circle closest-side, transparent 0%, transparent 86%, var(--wc-op-color-light, #d46c00) 87%, var(--wc-op-color-light, #d46c00) 100%); --wc-checked-color-light: #201d18; --wc-checked-mark-color-light: #201d18ca; --wc-checked-today-bg-light: radial-gradient(circle closest-side, transparent 0%, transparent 86%, var(--wc-op-color-light, #d46c00) 87%, var(--wc-op-color-light, #d46c00) 100%); --wc-checked-today-color-light: #9c2d25; --wc-bg-dark: #2b2923; --wc-title-color-dark: #f6f0e4; --wc-week-color-dark: #bdb4a6; --wc-date-color-dark: #f6f0e4; --wc-today-color-dark: #de6659; --wc-solar-color-dark: #dab061; --wc-mark-color-dark: #f6f0e4; --wc-checked-bg-dark: radial-gradient(circle closest-side, transparent 0%, transparent 86%, var(--wc-op-color-light, #d46c00) 87%, var(--wc-op-color-light, #d46c00) 100%); --wc-checked-color-dark: #f6f0e4; --wc-checked-mark-color-dark: #f6f0e4; --wc-checked-today-bg-dark: radial-gradient(circle closest-side, transparent 0%, transparent 86%, var(--wc-op-color-light, #d46c00) 87%, var(--wc-op-color-light, #d46c00) 100%); --wc-checked-today-color-dark: #de6659; --wc-annual-bottom-height: 0px;',
    marks: [] as CalendarMark[],
    eventLabel: '',
    personMeta: '',
    selectedLabel: '',
    lunarText: '',
    lunarCn: '',
    level: '' as ZeriLevel | '',
    levelClass: '',
    reasons: [] as string[],
    kuJior: ['', ''] as string[],
    laSe: ['', ''] as string[],
    zeta: ['', ''] as string[],
    xiDeYi: '',
    xiDeCn: ''
  },

  /** 测算人信息 */
  person: null as ZeriPerson | null,
  /** 测算事项 */
  eventKey: 'marriage' as ZeriEventKey,
  /** 彝历起始月份 */
  monthStart: 0,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(query: Record<string, string>) {
    const event = findEvent(query.event)
    const zodiacIndex = Number(query.zodiac)
    const age = Number(query.age)
    const gender: ZeriGender = query.gender === 'female' ? 'female' : query.gender === 'male' ? 'male' : ''

    if (!event || !(zodiacIndex >= 0 && zodiacIndex < 12) || !(age > 0) || !gender) {
      wx.showToast({ title: '测算信息不完整', icon: 'none' })
      wx.navigateBack()
      return
    }

    this.person = { zodiacIndex, age, gender }
    this.eventKey = event.key
    this.monthStart = getMonthStartIndex()
    this.setData({
      isDark: wx.getStorageSync('yi-theme') === 'dark',
      eventLabel: event.label,
      personMeta: `${ZODIAC_CN[zodiacIndex]}属 · ${age}岁 · ${gender === 'female' ? '女' : '男'}`
    })
  },

  /**
   * 日历加载完成
   */
  onCalendarLoad(e: WechatMiniprogram.CustomEvent) {
    if (e.detail.checked) this.updateSelected(e.detail.checked)
    this.buildMarks(e.detail.range)
  },

  /**
   * 点击日期：展示当日彝历与吉凶
   */
  onCalendarClick(e: WechatMiniprogram.CustomEvent) {
    this.updateSelected(e.detail.checked)
  },

  /**
   * 切换月份：重建吉凶标记
   */
  onCalendarChange(e: WechatMiniprogram.CustomEvent) {
    this.buildMarks(e.detail.range)
  },

  /**
   * 主题切换（由 layout 组件触发）
   */
  onThemeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ isDark: e.detail.isDark })
    if (lastRange.length) this.buildMarks(lastRange)
  },

  /**
   * 为当前渲染范围内的每一天生成吉凶标记
   */
  buildMarks(range: Array<{ year: number; month: number; day: number }>) {
    if (!range || range.length < 2 || !this.person) return
    lastRange = range
    const person = this.person
    const [start, end] = range
    const marks: CalendarMark[] = []
    const cur = new Date(start.year, start.month - 1, start.day)
    const last = new Date(end.year, end.month - 1, end.day)

    while (cur.getTime() <= last.getTime()) {
      const year = cur.getFullYear()
      const month = cur.getMonth() + 1
      const day = cur.getDate()
      const level = this.eventKey === 'house'
        ? getHouseBuild(person.age, ZODIAC_CN[person.zodiacIndex], fmt(cur)).level
        : levelOf(fmt(cur), person, this.eventKey, this.monthStart)
      const tone = LEVEL_TONE[level]
      marks.push({
        year,
        month,
        day,
        type: 'festival',
        text: level,
        style: `color: ${this.data.isDark ? tone.dark : tone.light};font-size: 22rpx;font-weight: 600;`
      })
      cur.setDate(cur.getDate() + 1)
    }
    this.setData({ marks })
  },

  /**
   * 更新选中日期展示：当日彝历 + 综合吉凶
   */
  updateSelected(checked: { year: number; month: number; day: number }) {
    if (!this.person) return
    const d = new Date(checked.year, checked.month - 1, checked.day)
    const dateStr = fmt(d)
    const yiDate = getYiTaBoo(dateStr, this.monthStart)
    const houseBuild = this.eventKey === 'house'
      ? getHouseBuild(this.person.age, ZODIAC_CN[this.person.zodiacIndex], dateStr)
      : null
    const result = houseBuild
      ? { level: houseBuild.level, reasons: houseBuild.reasons, xiDeYi: '', xiDeCn: '' }
      : evaluateDay(dateStr, this.person, this.eventKey, this.monthStart)
    const ku = getKujior(dateStr).kujior
    const laSe = getLaSe(dateStr)
    const zeta = getZeTa(dateStr) || ['', '']
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']

    this.setData({
      selectedLabel: `${checked.year}年${checked.month}月${checked.day}日 · 星期${weekdays[d.getDay()]}`,
      lunarText: `${yiDate.year[0]}ꈎ·${yiDate.month[0]}ꆪ·${yiDate.day[0]}ꑍ·${yiDate.dayMoon[0]}ꑍ`,
      lunarCn: `${yiDate.year[1]}年·${yiDate.month[1]}月·${yiDate.day[1]}日·${yiDate.dayMoon[1]}日`,
      level: result.level,
      levelClass: LEVEL_CLASS[result.level],
      reasons: result.reasons,
      kuJior: ku,
      laSe,
      zeta,
      xiDeYi: result.xiDeYi,
      xiDeCn: result.xiDeCn
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '彝族生活日历 · 择日测算',
      path: `/subpages/zeri/zeri?event=${this.data.eventKey}`
    }
  }
})
