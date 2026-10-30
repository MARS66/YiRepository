// pages/suigong/suigong.ts
import { ZODIAC, ZODIAC_CN, getXiDe, getYiAge } from '../../utils/yi-lunar/index'

interface ZodiacOption {
  cn: string
  yi: string
}

interface GenderOption {
  key: 'male' | 'female'
  label: string
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
    draftCanSave: false
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
      draftCanSave: motherZodiacIndex >= 0 && motherAge > 0
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
      draftCanSave: personZodiacIndex >= 0 && personAge > 0 && personGender.length > 0
    })
  },

  /** 关闭弹层 */
  closeEditor() {
    this.setData({ editingType: '' })
  },

  /** 阻止弹层内的滑动穿透 */
  noop() {},

  /** 弹层内选择属相：刷新可选岁数 */
  onDraftZodiacSelect(e: WechatMiniprogram.TouchEvent) {
    const draftZodiacIndex = Number(e.currentTarget.dataset.index)
    const draftAges = this.agesOf(draftZodiacIndex)
    this.setData({
      draftZodiacIndex,
      draftAges,
      draftAge: 0,
      draftCanSave: false
    })
  },

  /** 弹层内选择岁数 */
  onDraftAgeSelect(e: WechatMiniprogram.TouchEvent) {
    const draftAge = Number(e.currentTarget.dataset.age)
    this.setData({
      draftAge,
      draftCanSave: this.draftReady(this.data.draftZodiacIndex, draftAge, this.data.draftGender)
    })
  },

  /** 弹层内选择性别 */
  onDraftGenderSelect(e: WechatMiniprogram.TouchEvent) {
    const draftGender = String(e.currentTarget.dataset.key || '')
    this.setData({
      draftGender,
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

  /** 开始测算：永恒喜得取母亲与本人岁数差，今年喜得取本人岁数 */
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
      title: '彝族生活日历 · 喜得测算',
      path: '/pages/index/index'
    }
  }
})
