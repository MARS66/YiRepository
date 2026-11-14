import { getYiTaBoo, getTodayFortune } from '../../plugin/yi-lunar/index'
import { playPhraseAudio } from '../../utils/audio'
import { isAutoAudio, getMonthStartIndex } from '../../utils/settings'
import { FestivalCountdown, getNextFestival } from '../../utils/festival'
import dayjs from 'dayjs'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
/** 平时海报底图：/static/normal 下的照片 */
const NORMAL_BACKGROUNDS = [
  '/static/normal/0.jpg',
  '/static/normal/1.jpg',
  '/static/normal/2.jpg',
  '/static/normal/3.jpg',
  '/static/normal/4.jpg',
  '/static/normal/5.jpg',
  '/static/normal/6.jpg'
]

/** 彝族年海报底图：/static/nian 下的图片 */
const YI_NEW_YEAR_BACKGROUNDS = [
  '/static/nian/0.jpg',
  '/static/nian/1.jpg',
  '/static/nian/2.jpg',
  '/static/nian/3.jpg'
]

Page({
  data: {
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    yiDate: null as ReturnType<typeof getYiTaBoo> | null,
    todayFortune: { taboo: [] as string[], tabooFull: '' },
    solarDate: '',
    date: '',
    month: '',
    weekday: '',
    year: '',
    monthStart: 0,
    showYiNewYearPoster: false,
    posterBackground: '',
    festivalCountdown: null as FestivalCountdown | null
  },

  onThemeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ isDark: e.detail.isDark })
  },

  onShow() {
    const monthStart = getMonthStartIndex()
    const today = dayjs()
    const solarDate = today.format('YYYY-MM-DD')
    if (solarDate === this.data.solarDate && monthStart === this.data.monthStart) return

    const yiDate = getYiTaBoo(solarDate, monthStart)
    const festivalCountdown = getNextFestival(solarDate)
    const showYiNewYearPoster = festivalCountdown !== null && festivalCountdown.name === '彝族年' && festivalCountdown.days <= 7
    let posterBackground = this.data.posterBackground
    if (solarDate !== this.data.solarDate) {
      const pool = showYiNewYearPoster ? YI_NEW_YEAR_BACKGROUNDS : NORMAL_BACKGROUNDS
      const index = Math.floor(Math.random() * pool.length)
      posterBackground = pool[index]
    }
    this.setData({
      yiDate,
      solarDate,
      monthStart,
      month: today.format('MM'),
      date: today.format('DD'),
      year: today.format('YYYY'),
      weekday: WEEKDAYS[today.day()],
      todayFortune: getTodayFortune(yiDate.dayZodiacIndex),
      festivalCountdown,
      showYiNewYearPoster,
      posterBackground
    })
  },

  onReady() {
    if (!isAutoAudio()) return
    const audio = this.selectComponent('#page-audio')
    if (audio && this.data.solarDate) audio.playDate(this.data.solarDate)
  },

  onHide() {
    const audio = this.selectComponent('#page-audio')
    if (audio) audio.stopAudio()
  },

  playFortune() {
    const word = this.data.todayFortune.taboo[0]
    if (word) playPhraseAudio(word)
  },

  goMonthSetting() {
    wx.navigateTo({ url: '/subpages/mine/month/month' })
  },

  onShareAppMessage() {
    const { solarDate, yiDate } = this.data
    return {
      title: yiDate ? `今日彝历｜${solarDate} · ${yiDate.month[1]}月${yiDate.day[1]}日` : '今日彝历',
      path: '/pages/index/index'
    }
  }
})
