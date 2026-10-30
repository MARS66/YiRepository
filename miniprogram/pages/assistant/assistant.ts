// pages/assistant/assistant.ts
import {
  ASSISTANT_TOOLS,
  AssistantTool,
  getRecentAssistants,
  recordAssistant,
} from '../../utils/assistants'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    tools: ASSISTANT_TOOLS,
    recentAssistants: [] as AssistantTool[],
  },

  /**
   * 点击助手：记录一次使用，有 url 跳转对应页面，无 url 提示开发中
   */
  onToolTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const tool = this.data.tools[index]
    if (!tool) return
    this.useTool(tool)
  },

  /**
   * 点击「最近使用」项
   */
  onRecentTap(e: WechatMiniprogram.TouchEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const tool = this.data.recentAssistants[index]
    if (!tool) return
    this.useTool(tool)
  },

  /**
   * 记录最近使用并处理跳转
   */
  useTool(tool: AssistantTool) {
    recordAssistant(tool)
    this.setData({ recentAssistants: getRecentAssistants() })
    if (!tool.url) {
      wx.showToast({ title: '正在开发中，敬请期待', icon: 'none' })
      return
    }
    wx.navigateTo({ url: tool.url })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({ recentAssistants: getRecentAssistants() })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
