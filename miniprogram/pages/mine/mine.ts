// pages/mine/mine.ts
import { ZODIAC, ZODIAC_CN } from '../../plugin/yi-lunar/index'
import { getMonthStartIndex } from '../../utils/settings'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    monthYi: '',
    monthLabel: ''
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
    this.refreshSummary()
  },

  /**
   * 生命周期函数--监听页面显示：子页面修改后返回时同步概览
   */
  onShow() {
    this.refreshSummary()
  },

  /** 刷新概览状态 */
  refreshSummary() {
    const monthStart = getMonthStartIndex()
    this.setData({
      monthYi: ZODIAC[monthStart],
      monthLabel: `${ZODIAC_CN[monthStart]}月为正月`
    })
  },

  /** 音频设置 */
  goAudio() {
    wx.navigateTo({ url: '/subpages/mine/audio/audio' })
  },

  /** 月份设置 */
  goMonth() {
    wx.navigateTo({ url: '/subpages/mine/month/month' })
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
