// pages/index/index.ts
import { 
  getYiTaBoo, 
  getTodayFortune, 
  getKujior,
  getLaSe, 
  getZeTa,
  getXingxiu,
  getYearInfo
} from '../../plugin/yi-lunar/index'
import {WORDS} from '../../utils/word'
import { isAutoAudio, getMonthStartIndex } from '../../utils/settings'
import dayjs from "dayjs";
const CH_MONTHS = [ '一' , '二' , '三' , '四' , '五' , '六' , '七' , '八' , '九' , '十' , '十一' , '十二' ]
/** 首页是否已完成首次渲染（用于区分首次自动播放与切回tab） */
let pageReady = false

/** 彝历详情术语项：{ yi: 彝文, cn: 中文, valueYi: 值彝文, valueCn: 值中文 } */
interface DetailItem {
  yi: string
  cn: string
  valueYi: string
  valueCn: string
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    yiDate:{} as any,
    todayFortune:{},
    detailItems: [] as DetailItem[],
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
   * 主题切换（由 layout 组件触发）：同步 isDark，用于 page-meta 背景色
   */
  onThemeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ isDark: e.detail.isDark })
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
    const kuJior = getKujior().kujior as string[]
    const laSe = getLaSe(dataStr)
    const zeta = getZeTa(dataStr)
    const yearInfo = getYearInfo(dataStr)
    const xingxiu = getXingxiu(dataStr)
     this.setData({
      yiDate,
      solarDate: dataStr,
      month: (dayjs(dataStr).month() + 1).toString(),
      weekday: CH_MONTHS[dayjs(dataStr).day()],
      date: dayjs(dataStr).date().toString(),
      year: dayjs(dataStr).year().toString(),
      monthEn: dayjs(dataStr).format('MMMM').toUpperCase(),
      todayFortune: getTodayFortune(yiDate.dayZodiacIndex),
      detailItems: [
        { yi: 'ꄤꁨꌺ', cn: '塔博惹', valueYi: yiDate.tabooSon[0], valueCn: yiDate.tabooSon[1] },
        { yi: 'ꈐꐡ', cn: '库觉', valueYi: kuJior[0], valueCn: kuJior[1] },
        { yi: 'ꆿꌋ', cn: '狼色', valueYi: laSe[0], valueCn: laSe[1] },
        { yi: 'ꍀꌋ', cn: '日色', valueYi: xingxiu.yi, valueCn: xingxiu.cn },
        { yi: 'ꃅꌋꋠꑍ', cn: '木色则尼', valueYi: zeta[0], valueCn: zeta[1] },
        { yi: 'ꄤꁨꀋꃀ', cn: '母塔博', valueYi: yiDate.tabooMon[0], valueCn: yiDate.tabooMon[1] },
        { yi: 'ꄤꁨꀋꀮ', cn: '公塔博', valueYi: yiDate.tabooFat[0], valueCn: yiDate.tabooFat[1] },
        { yi: 'ꈎꏸ', cn: '值星', valueYi: yearInfo.suizhiXing[0], valueCn: yearInfo.suizhiXing[1] }
      ]
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
   * 跳转「我的」月份设置（彝历起始月因区域而异）
   */
  goMonthSetting() {
    wx.navigateTo({ url: '/subpages/mine/month/month' })
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