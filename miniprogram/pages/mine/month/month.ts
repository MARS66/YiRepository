// pages/mine/month/month.ts
import { ZODIAC, ZODIAC_CN } from '../../../utils/yi-lunar/index'
import { getMonthStartIndex, setMonthStartIndex } from '../../../utils/settings'

const MONTH_TERMS = [
  '正月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月'
]

interface ZodiacOption {
  cn: string
  yi: string
}

interface MonthOrderItem {
  term: string
  cn: string
  yi: string
}

/** 按正月起始属相生成整年月份顺序 */
function buildOrder(start: number): MonthOrderItem[] {
  return MONTH_TERMS.map((term, offset) => {
    const index = (start + offset) % 12
    return { term, cn: ZODIAC_CN[index], yi: ZODIAC[index] }
  })
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    zodiacs: [] as ZodiacOption[],
    monthStart: 0,
    monthLabel: '',
    monthYi: '',
    order: [] as MonthOrderItem[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      zodiacs: ZODIAC_CN.map((cn, index) => ({ cn, yi: ZODIAC[index] }))
    })
    this.applyStart(getMonthStartIndex())
  },

  /** 应用起始属相并刷新展示 */
  applyStart(index: number) {
    const safe = index >= 0 && index < 12 ? index : 0
    this.setData({
      monthStart: safe,
      monthLabel: `${ZODIAC_CN[safe]}月为正月`,
      monthYi: ZODIAC[safe],
      order: buildOrder(safe)
    })
  },

  /** 选择与农历正月对应的属相月 */
  onMonthSelect(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (index < 0 || index > 11) return
    setMonthStartIndex(index)
    this.applyStart(index)
    wx.showToast({ title: '月份起始已更新', icon: 'none' })
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
