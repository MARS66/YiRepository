// pages/mine/mine.ts
import { ZODIAC, ZODIAC_CN } from '../../utils/yi-lunar/index'
import { getMembers, getMonthStartIndex } from '../../utils/settings'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    monthYi: '',
    monthLabel: '',
    members: [] as { id: string; icon: string }[]
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
    this.refreshMembers()
  },

  /** 刷新概览状态 */
  refreshSummary() {
    const monthStart = getMonthStartIndex()
    this.setData({
      monthYi: ZODIAC[monthStart],
      monthLabel: `${ZODIAC_CN[monthStart]}月为正月`
    })
  },

  /** 刷新常用信息图标 */
  refreshMembers() {
    const members = getMembers().map((record) => ({
      id: record.id,
      icon: record.name.slice(0, 1)
    }))
    this.setData({ members })
  },

  /** 常用人员管理 */
  goMembers() {
    wx.navigateTo({ url: '/pages/mine/members/members' })
  },

  /** 音频设置 */
  goAudio() {
    wx.navigateTo({ url: '/pages/mine/audio/audio' })
  },

  /** 月份设置 */
  goMonth() {
    wx.navigateTo({ url: '/pages/mine/month/month' })
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
