// pages/index/index.ts
import { 
  getYiTaBoo, 
  getTodayFortune, 
  getKujior,
  getLaSe, 
  getZeTa,
} from '../../utils/yi-lunar/index'
import {WORDS} from '../../utils/word'
import { isAutoAudio, getMonthStartIndex } from '../../utils/settings'
import dayjs from "dayjs";
const CH_MONTHS = [ '一' , '二' , '三' , '四' , '五' , '六' , '七' , '八' , '九' , '十' , '十一' , '十二' ]
/** 首页是否已完成首次渲染（用于区分首次自动播放与切回tab） */
let pageReady = false

Page({

  /**
   * 页面的初始数据
   */
  data: {
    yiDate:{} as any,
    todayFortune:{},
    solarDate: '',
    date: '01',
    month: '九月',
    weekday: '星期二',
    year: '',
    monthEn: 'SEPTEMBER',
    goodFortune: { main: '会友 · 出行', sub: '整理家宅 · 祈福' },
    badFortune: { main: '争执 · 仓促', sub: '重大动土 · 远行' },
    cloudWords: WORDS.slice(0, 90).split(' ') as string[],
    monthStart: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    pageReady = false
    this.setData({ monthStart: getMonthStartIndex() })
    this.initPage(dayjs().format('YYYY-MM-DD'))
  },
  initPage(dataStr:string){
    const yiDate=getYiTaBoo(dataStr, this.data.monthStart)
     this.setData({
      yiDate,
      solarDate: dataStr,
      month: (dayjs(dataStr).month() + 1).toString(),
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
  /**
   * 自动播放当日彝历语音
   */
  playDailyAudio() {
    if (!isAutoAudio()) return
    const audio = this.selectComponent('#page-audio')
    if (audio && this.data.solarDate) audio.playDate(this.data.solarDate)
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    pageReady = true
    this.playDailyAudio()
  },



  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 「我的」页面修改起始月份后，返回首页时同步刷新彝历
    const monthStart = getMonthStartIndex()
    if (monthStart !== this.data.monthStart) {
      this.setData({ monthStart })
      if (this.data.solarDate) this.initPage(this.data.solarDate)
    }
    // 切回首页时按设置自动播放
    if (pageReady) this.playDailyAudio()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    const audio = this.selectComponent('#page-audio')
    if (audio) audio.stopAudio()
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