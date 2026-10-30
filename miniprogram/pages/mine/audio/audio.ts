// pages/mine/audio/audio.ts
import { AudioMode, getAudioMode, setAudioMode } from '../../../utils/settings'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    audioMode: 'manual' as AudioMode
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({ audioMode: getAudioMode() })
  },

  /** 切换音频播放模式 */
  onAudioMode(e: WechatMiniprogram.TouchEvent) {
    const mode = String(e.currentTarget.dataset.mode) as AudioMode
    if (mode !== 'auto' && mode !== 'manual') return
    setAudioMode(mode)
    this.setData({ audioMode: mode })
    wx.showToast({
      title: mode === 'auto' ? '已开启自动播放' : '已切换手动播放',
      icon: 'none'
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
