// pages/zeri/zeri.ts
// 择日测算：所有吉事（结婚、订婚、房屋修建等）共用同一个输入表单。
// 测算事项由助手页通过 URL 参数带入，本页只展示，不再选择。
import { ZODIAC, ZODIAC_CN, getYiAge } from '../../plugin/yi-lunar/index'
import { Lunar } from '../libs/lunar-typescript'
import { Gender, getMembers } from '../../utils/settings'
import { ZERI_EVENTS, ZeriEventKey, findEvent } from '../../utils/zeri'

interface ZodiacOption {
  cn: string
  yi: string
}

interface GenderOption {
  key: 'male' | 'female'
  label: string
}

/** 常用人员快捷选项 */
interface QuickMember {
  id: string
  name: string
  zodiacIndex: number
  age: number
  gender: Gender
  genderLabel: string
}

const GENDERS: GenderOption[] = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' }
]

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    eventKey: ZERI_EVENTS[0].key as ZeriEventKey,
    eventIcon: ZERI_EVENTS[0].icon,
    eventLabel: ZERI_EVENTS[0].label,
    eventDesc: '依属相、岁数选择吉日',
    /** 输入对象称谓：房屋修建填女主人，其余为测算人 */
    personLabel: '女主人',
    /** 是否需要选择性别：房屋修建的女主人固定为女，无需选择 */
    showGender: true,
    zodiacs: [] as ZodiacOption[],
    genders: GENDERS,
    quickMembers: [] as QuickMember[],
    personZodiacIndex: -1,
    personAge: 0,
    personGender: '',
    personMeta: '',
    canCalc: false,
    showEditor: false,
    draftZodiacIndex: -1,
    draftAge: 0,
    draftAges: [] as number[],
    draftGender: '',
    draftQuickId: '',
    draftCanSave: false
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
  onLoad(query: Record<string, string>) {
    const event = findEvent(query.event)
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] })),
      quickMembers: this.buildQuickMembers()
    })
    if (event) {
      this.setData({
        eventKey: event.key,
        eventIcon: event.icon,
        eventLabel: event.label,
        eventDesc: `${event.action}择日`,
        personLabel: event.key === 'house' ? '女主人' : '测算人',
        showGender: event.key !== 'house'
      })
    }
  },

  onShow() {
    this.setData({ quickMembers: this.buildQuickMembers() })
  },

  /** 读取常用人员，按当前农历年换算虚岁 */
  buildQuickMembers(): QuickMember[] {
    const year = Lunar.fromDate(new Date()).getYear()
    return getMembers().map((record) => ({
      id: record.id,
      name: record.name,
      zodiacIndex: record.zodiacIndex,
      age: year - record.birthYear + 1,
      gender: record.gender || '',
      genderLabel: record.gender === 'female' ? '女' : record.gender === 'male' ? '男' : ''
    }))
  },

  /** 按属相列出今年可选虚岁 */
  agesOf(zodiacIndex: number): number[] {
    if (zodiacIndex < 0) return []
    return getYiAge(ZODIAC_CN[zodiacIndex])
  },

  /** 弹层内容是否可确定 */
  draftReady(zodiacIndex: number, age: number, gender: string): boolean {
    return zodiacIndex >= 0 && age > 0 && gender.length > 0
  },

  /** 打开「测算人信息」弹层 */
  openPerson() {
    const { personZodiacIndex, personAge, personGender, eventKey } = this.data
    const draftGender = eventKey === 'house' ? 'female' : personGender
    this.setData({
      showEditor: true,
      draftZodiacIndex: personZodiacIndex,
      draftAge: personAge,
      draftAges: this.agesOf(personZodiacIndex),
      draftGender,
      draftQuickId: '',
      draftCanSave: this.draftReady(personZodiacIndex, personAge, draftGender),
      quickMembers: this.buildQuickMembers()
    })
  },

  /** 关闭弹层 */
  closeEditor() {
    this.setData({ showEditor: false })
  },

  /** 阻止弹层内的滑动穿透 */
  noop() {},

  /** 点选常用人员：自动填入属相、岁数与性别 */
  onDraftQuickPick(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const member = this.data.quickMembers[index]
    if (!member || member.zodiacIndex < 0 || member.age <= 0) return
    const draftGender = this.data.eventKey === 'house' ? 'female' : member.gender
    this.setData({
      draftQuickId: member.id,
      draftZodiacIndex: member.zodiacIndex,
      draftAges: this.agesOf(member.zodiacIndex),
      draftAge: member.age,
      draftGender,
      draftCanSave: this.draftReady(member.zodiacIndex, member.age, draftGender)
    })
  },

  /** 弹层内选择属相：刷新可选岁数 */
  onDraftZodiacSelect(e: WechatMiniprogram.TouchEvent) {
    const draftZodiacIndex = Number(e.currentTarget.dataset.index)
    this.setData({
      draftZodiacIndex,
      draftAges: this.agesOf(draftZodiacIndex),
      draftAge: 0,
      draftQuickId: '',
      draftCanSave: false
    })
  },

  /** 弹层内选择岁数 */
  onDraftAgeSelect(e: WechatMiniprogram.TouchEvent) {
    const draftAge = Number(e.currentTarget.dataset.age)
    this.setData({
      draftAge,
      draftQuickId: '',
      draftCanSave: this.draftReady(this.data.draftZodiacIndex, draftAge, this.data.draftGender)
    })
  },

  /** 弹层内选择性别 */
  onDraftGenderSelect(e: WechatMiniprogram.TouchEvent) {
    const draftGender = String(e.currentTarget.dataset.key || '')
    this.setData({
      draftGender,
      draftQuickId: '',
      draftCanSave: this.draftReady(this.data.draftZodiacIndex, this.data.draftAge, draftGender)
    })
  },

  /** 确认弹层内容 */
  confirmEditor() {
    const { draftZodiacIndex, draftAge, draftGender, eventKey } = this.data
    if (!this.draftReady(draftZodiacIndex, draftAge, draftGender)) {
      wx.showToast({ title: eventKey === 'house' ? '请选择属相与岁数' : '请选择属相、岁数与性别', icon: 'none' })
      return
    }
    const genderLabel = draftGender === 'female' ? '女' : '男'
    this.setData({
      showEditor: false,
      personZodiacIndex: draftZodiacIndex,
      personAge: draftAge,
      personGender: draftGender,
      personMeta: `${ZODIAC[draftZodiacIndex]} ${ZODIAC_CN[draftZodiacIndex]}属 · ${draftAge}岁 · ${genderLabel}`,
      canCalc: true
    })
  },

  /** 开始推算：携带事项与测算人信息进入结果页 */
  startCalc() {
    const { eventKey, personZodiacIndex, personAge, personGender, canCalc } = this.data
    if (!canCalc) {
      wx.showToast({ title: `请先填写${this.data.personLabel}信息`, icon: 'none' })
      return
    }
    wx.navigateTo({
      url: `/subpages/zeri/result/result?event=${eventKey}&zodiac=${personZodiacIndex}&age=${personAge}&gender=${personGender}`
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
