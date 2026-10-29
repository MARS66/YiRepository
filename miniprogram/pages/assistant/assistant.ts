// pages/assistant/assistant.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tools: [
      { 
        icon: '历', 
        label: '彝历查询', 
        desc: '选择公历日期查询对应彝历',
        url: '/pages/date-navigation/date-navigation'
       },
      { 
        icon: '西', 
        label: '西德计算', 
        desc: '计算的永恒西德，今年西德',
        url: '/pages/western/western'
      },
      { icon: '合', label: '生肖合婚', desc: '文化参考与相处建议' },
      { icon: '德', label: '西德合婚', desc: '彝族传统文化参考' }
    ],
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