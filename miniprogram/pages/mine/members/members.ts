// pages/mine/members/members.ts
import {
  ZODIAC,
  ZODIAC_CN,
  DIRECTION,
  DIRECTION_CN,
  getYiAge
} from '../../../utils/yi-lunar/index'
import { Lunar } from '../../../utils/lunar-typescript'
import { MemberRecord, getMembers, saveMembers } from '../../../utils/settings'

/** 常见直系称谓快捷选项 */
const QUICK_NAMES = [
  '本人',
  '父亲',
  '母亲',
  '儿子',
  '女儿',
  '爷爷',
  '奶奶',
  '外公',
  '外婆',
  '哥哥',
  '姐姐',
  '弟弟',
  '妹妹',
  '配偶'
]

interface ZodiacOption {
  cn: string
  yi: string
}

interface DirectionOption {
  cn: string
  yi: string
}

interface AgeOption {
  age: number
  birthYear: number
}

interface MemberView extends MemberRecord {
  icon: string
  zodiacCn: string
  zodiacYi: string
  age: number
  directionCn: string
  directionYi: string
}

interface MemberForm {
  name: string
  zodiacIndex: number
  age: number
  birthYear: number
  directionIndex: number
}

function emptyForm(): MemberForm {
  return { name: '', zodiacIndex: -1, age: 0, birthYear: 0, directionIndex: -1 }
}

/** 当前农历年（跨农历新年时才递增，避免年龄一年不变） */
function currentLunarYear(): number {
  return Lunar.fromDate(new Date()).getYear()
}

/** 按属相列出当前可选虚岁，并反推出生年份 */
function buildAgeOptions(zodiacIndex: number): AgeOption[] {
  if (zodiacIndex < 0) return []
  const year = currentLunarYear()
  return getYiAge(ZODIAC_CN[zodiacIndex]).map((age) => ({
    age,
    birthYear: year - age + 1
  }))
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    zodiacs: [] as ZodiacOption[],
    directions: [] as DirectionOption[],
    quickNames: QUICK_NAMES,
    members: [] as MemberView[],
    showEditor: false,
    editingIndex: -1,
    form: emptyForm(),
    ageOptions: [] as AgeOption[],
    canSave: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] })),
      directions: DIRECTION_CN.map((cn, index) => ({ cn, yi: DIRECTION[index] }))
    })
    this.refreshMembers()
  },

  /**
   * 刷新常用人员列表（年龄按当前农历年实时计算）
   */
  refreshMembers() {
    const year = currentLunarYear()
    const members = getMembers().map((record) => ({
      ...record,
      icon: record.name.slice(0, 1),
      zodiacCn: ZODIAC_CN[record.zodiacIndex] || '',
      zodiacYi: ZODIAC[record.zodiacIndex] || '',
      age: year - record.birthYear + 1,
      directionCn: DIRECTION_CN[record.directionIndex] || '未设置',
      directionYi: DIRECTION[record.directionIndex] || ''
    }))
    this.setData({ members })
  },

  /**
   * 表单是否可保存
   */
  isFormValid(form: MemberForm): boolean {
    return form.name.trim().length > 0
      && form.zodiacIndex >= 0
      && form.age > 0
      && form.directionIndex >= 0
  },

  /** 打开「添加人员」弹层 */
  openAdd() {
    this.setData({
      showEditor: true,
      editingIndex: -1,
      form: emptyForm(),
      ageOptions: [],
      canSave: false
    })
  },

  /** 点击人员卡片进入编辑 */
  onMemberTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const record = getMembers()[index]
    if (!record) return
    const year = currentLunarYear()
    const ageOptions = buildAgeOptions(record.zodiacIndex)
    const form: MemberForm = {
      name: record.name,
      zodiacIndex: record.zodiacIndex,
      age: year - record.birthYear + 1,
      birthYear: record.birthYear,
      directionIndex: record.directionIndex
    }
    this.setData({
      showEditor: true,
      editingIndex: index,
      form,
      ageOptions,
      canSave: this.isFormValid(form)
    })
  },

  /** 列表内删除人员 */
  onDeleteTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const record = getMembers()[index]
    if (!record) return
    wx.showModal({
      title: '删除人员',
      content: `确定删除「${record.name}」吗？`,
      confirmColor: '#9c2d25',
      success: (res) => {
        if (!res.confirm) return
        const records = getMembers()
        records.splice(index, 1)
        saveMembers(records)
        this.refreshMembers()
        wx.showToast({ title: '已删除', icon: 'none' })
      }
    })
  },

  /** 关闭弹层 */
  closeEditor() {
    this.setData({ showEditor: false })
  },

  /** 阻止弹层内的滑动穿透 */
  noop() {},

  /** 输入称呼 */
  onNameInput(e: WechatMiniprogram.CustomEvent) {
    const form = { ...this.data.form, name: (e.detail.value as string) || '' }
    this.setData({ form, canSave: this.isFormValid(form) })
  },

  /** 快捷称谓 */
  onQuickName(e: WechatMiniprogram.TouchEvent) {
    const name = String(e.currentTarget.dataset.name || '')
    const form = { ...this.data.form, name }
    this.setData({ form, canSave: this.isFormValid(form) })
  },

  /** 选择属相：同步刷新可选虚岁 */
  onZodiacSelect(e: WechatMiniprogram.TouchEvent) {
    const zodiacIndex = Number(e.currentTarget.dataset.index)
    const form = { ...this.data.form, zodiacIndex, age: 0, birthYear: 0 }
    this.setData({
      form,
      ageOptions: buildAgeOptions(zodiacIndex),
      canSave: false
    })
  },

  /** 选择虚岁：反推并记录出生年份 */
  onAgeSelect(e: WechatMiniprogram.TouchEvent) {
    const age = Number(e.currentTarget.dataset.age)
    const option = this.data.ageOptions.find((item) => item.age === age)
    if (!option) return
    const form = { ...this.data.form, age, birthYear: option.birthYear }
    this.setData({ form, canSave: this.isFormValid(form) })
  },

  /** 选择永恒西德方位 */
  onDirectionSelect(e: WechatMiniprogram.TouchEvent) {
    const directionIndex = Number(e.currentTarget.dataset.index)
    const form = { ...this.data.form, directionIndex }
    this.setData({ form, canSave: this.isFormValid(form) })
  },

  /** 保存人员 */
  saveMember() {
    const form = this.data.form
    if (!this.isFormValid(form)) {
      wx.showToast({ title: '请完整填写称呼、属相、岁数和西德', icon: 'none' })
      return
    }
    const records = getMembers()
    const editingIndex = this.data.editingIndex
    const record: MemberRecord = {
      id: editingIndex >= 0 && records[editingIndex] ? records[editingIndex].id : `m-${Date.now()}`,
      name: form.name.trim(),
      zodiacIndex: form.zodiacIndex,
      birthYear: currentLunarYear() - form.age + 1,
      directionIndex: form.directionIndex
    }
    if (editingIndex >= 0) {
      records[editingIndex] = record
    } else {
      records.push(record)
    }
    saveMembers(records)
    this.setData({ showEditor: false })
    this.refreshMembers()
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  /** 删除人员 */
  deleteMember() {
    const index = this.data.editingIndex
    const record = getMembers()[index]
    if (!record) {
      this.setData({ showEditor: false })
      return
    }
    wx.showModal({
      title: '删除人员',
      content: `确定删除「${record.name}」吗？`,
      confirmColor: '#9c2d25',
      success: (res) => {
        if (!res.confirm) return
        const records = getMembers()
        records.splice(index, 1)
        saveMembers(records)
        this.setData({ showEditor: false })
        this.refreshMembers()
        wx.showToast({ title: '已删除', icon: 'none' })
      }
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '彝族生活日历',
      path: '/pages/index/index'
    }
  }
})
