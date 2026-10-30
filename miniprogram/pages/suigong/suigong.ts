// pages/suigong/suigong.ts
import { ZODIAC, ZODIAC_CN, getXiDe, getYiAge } from '../../utils/yi-lunar/index'
import { Lunar } from '../../utils/lunar-typescript'
import { Gender, getMembers } from '../../utils/settings'

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
  zodiacCn: string
  age: number
  gender: Gender
  genderLabel: string
}

const GENDERS: GenderOption[] = [
  { key: 'male', label: '男' },
  { key: 'female', label: '女' }
]

/** 弹层当前编辑对象 */
type EditingType = '' | 'mother' | 'person'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    zodiacs: [] as ZodiacOption[],
    genders: GENDERS,
    quickMembers: [] as QuickMember[],
    motherZodiacIndex: -1,
    motherAge: 0,
    personZodiacIndex: -1,
    personAge: 0,
    personGender: '',
    motherMeta: '',
    personMeta: '',
    canCalc: false,
    hasResult: false,
    eternalYi: '',
    eternalCn: '',
    yearYi: '',
    yearCn: '',
    editingType: '' as EditingType,
    draftZodiacIndex: -1,
    draftAge: 0,
    draftAges: [] as number[],
    draftGender: '',
    draftQuickId: '',
    draftCanSave: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] })),
      quickMembers: this.buildQuickMembers()
    })
  },

  /** 读取常用人员，按当前农历年换算虚岁 */
  buildQuickMembers(): QuickMember[] {
    const year = Lunar.fromDate(new Date()).getYear()
    return getMembers().map((record) => ({
      id: record.id,
      name: record.name,
      zodiacIndex: record.zodiacIndex,
      zodiacCn: ZODIAC_CN[record.zodiacIndex] || '',
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

  /** 五项条件是否齐备 */
  readyToCalc(
    motherZodiacIndex: number,
    motherAge: number,
    personZodiacIndex: number,
    personAge: number,
    personGender: string
  ): boolean {
    return motherZodiacIndex >= 0
      && motherAge > 0
      && personZodiacIndex >= 0
      && personAge > 0
      && personGender.length > 0
  },

  /** 弹层内容是否可确定 */
  draftReady(zodiacIndex: number, age: number, gender: string): boolean {
    if (this.data.editingType === 'mother') return zodiacIndex >= 0 && age > 0
    return zodiacIndex >= 0 && age > 0 && gender.length > 0
  },

  /** 打开母亲信息弹层 */
  openMother() {
    const { motherZodiacIndex, motherAge } = this.data
    this.setData({
      editingType: 'mother',
      draftZodiacIndex: motherZodiacIndex,
      draftAge: motherAge,
      draftAges: this.agesOf(motherZodiacIndex),
      draftGender: '',
      draftQuickId: '',
      draftCanSave: motherZodiacIndex >= 0 && motherAge > 0,
      quickMembers: this.buildQuickMembers()
    })
  },

  /** 打开测算人信息弹层 */
  openPerson() {
    const { personZodiacIndex, personAge, personGender } = this.data
    this.setData({
      editingType: 'person',
      draftZodiacIndex: personZodiacIndex,
      draftAge: personAge,
      draftAges: this.agesOf(personZodiacIndex),
      draftGender: personGender,
      draftQuickId: '',
      draftCanSave: personZodiacIndex >= 0 && personAge > 0 && personGender.length > 0,
      quickMembers: this.buildQuickMembers()
    })
  },

  /** 关闭弹层 */
  closeEditor() {
    this.setData({ editingType: '' })
  },

  /** 阻止弹层内的滑动穿透 */
  noop() {},

  /** 点选常用人员：自动填入属相、岁数（测算人含性别） */
  onDraftQuickPick(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const member = this.data.quickMembers[index]
    if (!member || member.zodiacIndex < 0 || member.age <= 0) return
    const isPerson = this.data.editingType === 'person'
    const draftGender = isPerson ? member.gender : ''
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
    const draftAges = this.agesOf(draftZodiacIndex)
    this.setData({
      draftZodiacIndex,
      draftAges,
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
    const type = this.data.editingType
    const { draftZodiacIndex, draftAge, draftGender } = this.data
    if (type === 'mother') {
      if (draftZodiacIndex < 0 || draftAge <= 0) {
        wx.showToast({ title: '请选择母亲属相与岁数', icon: 'none' })
        return
      }
      this.setData({
        editingType: '',
        motherZodiacIndex: draftZodiacIndex,
        motherAge: draftAge,
        motherMeta: `${ZODIAC[draftZodiacIndex]} ${ZODIAC_CN[draftZodiacIndex]}属 · ${draftAge}岁`,
        canCalc: this.readyToCalc(
          draftZodiacIndex,
          draftAge,
          this.data.personZodiacIndex,
          this.data.personAge,
          this.data.personGender
        ),
        hasResult: false
      })
      return
    }
    if (type === 'person') {
      if (draftZodiacIndex < 0 || draftAge <= 0 || draftGender.length === 0) {
        wx.showToast({ title: '请选择属相、岁数与性别', icon: 'none' })
        return
      }
      const genderLabel = draftGender === 'female' ? '女' : '男'
      this.setData({
        editingType: '',
        personZodiacIndex: draftZodiacIndex,
        personAge: draftAge,
        personGender: draftGender,
        personMeta: `${ZODIAC[draftZodiacIndex]} ${ZODIAC_CN[draftZodiacIndex]}属 · ${draftAge}岁 · ${genderLabel}`,
        canCalc: this.readyToCalc(
          this.data.motherZodiacIndex,
          this.data.motherAge,
          draftZodiacIndex,
          draftAge,
          draftGender
        ),
        hasResult: false
      })
    }
  },

  /** 开始测算：永恒西德取母亲与本人岁数差，今年西德取本人岁数 */
  calculate() {
    const { motherZodiacIndex, motherAge, personZodiacIndex, personAge, personGender } = this.data
    if (!this.readyToCalc(motherZodiacIndex, motherAge, personZodiacIndex, personAge, personGender)) {
      wx.showToast({ title: '请先填写母亲与测算人信息', icon: 'none' })
      return
    }
    const eternal = getXiDe(motherAge - personAge, true)
    const current = getXiDe(personAge, personGender === 'female')
    this.setData({
      hasResult: true,
      eternalYi: eternal[0],
      eternalCn: eternal[1],
      yearYi: current[0],
      yearCn: current[1]
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '彝族生活日历 · 西德测算',
      path: '/pages/index/index'
    }
  }
})
