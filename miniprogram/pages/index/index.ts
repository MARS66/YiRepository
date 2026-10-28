// pages/index/index.ts
import { getYiTaBoo, getTodayFortune,getKujior,getLaSe,getZeTa } from '../../utils/yinar'
import { YiAudioPlayer } from '../../utils/howler'
import dayjs from "dayjs";
const CH_MONTHS = [ '一' , '二' , '三' , '四' , '五' , '六' , '七' , '八' , '九' , '十' , '十一' , '十二' ]

Page({
  player: null as YiAudioPlayer | null,
  currentDate: '',

  /**
   * 页面的初始数据
   */
  data: {
    yiDate:{} as any,
    todayFortune:{},
    date: '01',
    month: '九月',
    weekday: '星期二',
    year: '',
    monthEn: 'SEPTEMBER',
    goodFortune: { main: '会友 · 出行', sub: '整理家宅 · 祈福' },
    badFortune: { main: '争执 · 仓促', sub: '重大动土 · 远行' },
    audioPlaying: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initPage(dayjs().format('YYYY-MM-DD'))
    this.player = new YiAudioPlayer({
      onPlayingChange: (playing) => this.setData({ audioPlaying: playing })
    })
  },
  initPage(dataStr:string){
    this.currentDate = dataStr
    const yiDate=getYiTaBoo(dataStr)
     this.setData({
      yiDate,
      month: CH_MONTHS[dayjs(dataStr).month()],
      weekday: CH_MONTHS[dayjs(dataStr).day()],
      date: dayjs(dataStr).date().toString(),
      year: dayjs(dataStr).year().toString(),
      monthEn: dayjs(dataStr).format('MMMM').toUpperCase(),
      kuJior:getKujior().kujior,
      laSe:getLaSe(dataStr),
      zeta:getZeTa(dataStr),
      todayFortune: getTodayFortune(yiDate.dayZodiacIndex)
    })
  },
  playAudio(){
    if (!this.player) return
    if (this.player.isPlaying) {
      console.log('[playAudio] 点击：isPlaying=true，执行停止')
      this.player.stop()
      return
    }
    console.log('[playAudio] 点击：开始播放', this.currentDate)
    this.player.play(this.currentDate)
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
    if (this.player) {
      this.player.destroy()
      this.player = null
    }
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