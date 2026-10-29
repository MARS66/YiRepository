// pages/date-navigation/date-navigation.ts
import { getYiTaBoo, getTodayFortune, getKujior, getLaSe, getZeTa } from '../../utils/yi-lunar/index'
import { getFestival } from 'chinese-workday'
import { Lunar } from '../../utils/lunar-typescript'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const CH_MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']

/** 格式化 Date → YYYY-MM-DD */
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 解析 YYYY-MM-DD → Date */
function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 火把节起始日：每年农历六月二十四对应的阳历日期 */
function getTorchStart(year: number): Date {
  const solar = Lunar.fromYmd(year, 6, 24).getSolar()
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay())
}

/** 彝族年：每年阳历 11月20日-26日（7 天） */
function isYiYear(d: Date): boolean {
  return d.getMonth() === 10 && d.getDate() >= 20 && d.getDate() <= 26
}

Page({
  /** 当前检索的日期 YYYY-MM-DD */
  currentDate: '',

  /**
   * 页面的初始数据
   */
  data: {
    solarDate: '',
    dateText: '',
    yearText: '',
    monthText: '',
    weekday: '',
    relativeDay: '',
    festival: '',
    lunarText: '',
    jieQi: '',
    yiDate: {} as any,
    todayFortune: {} as any,
    kuJior: [] as string[],
    laSe: [] as string[],
    zeta: [] as string[],
    yearGanZhi: '',
    shengXiao: '',
    dayGanZhi: '',
    naYin: '',
    chongSha: '',
    lunarYi: '',
    lunarJi: '',
    yueXiang: '',
    zhiXing: '',
    dayTianShen: '',
    xiu: '',
    xiuLuck: '',
    xunKong: '',
    pengZu: '',
    jiShen: '',
    xiongSha: '',
    posXi: '',
    posFu: '',
    posCai: '',
    posYangGui: '',
    posYinGui: '',
    baZi: ''
  },

  /**
   * 计算并展示指定日期的彝历详细信息
   */
  selectDate(dateStr: string) {
    this.currentDate = dateStr
    const d = parse(dateStr)
    const yiDate = getYiTaBoo(dateStr)

    // 相对今天
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const today0 = new Date()
    today0.setHours(0, 0, 0, 0)
    const diff = Math.round((d0.getTime() - today0.getTime()) / 86400000)
    const relativeDay = diff === 0 ? '今天' : diff < 0 ? `${-diff}天前` : `${diff}天后`

    // 节日：火把节 / 彝族年 > 国家法定节假日 > 农历节日
    const ts = getTorchStart(d.getFullYear())
    const te = new Date(ts)
    te.setDate(ts.getDate() + 6)
    const lsName = d >= ts && d <= te ? '火把节' : isYiYear(d) ? '彝族年' : ''
    const raw = getFestival(dateStr)
    const solarFestival = lsName || (raw !== '周末' && raw !== '工作日' && !raw.startsWith('补') ? raw : '')
    const lunar = Lunar.fromDate(d)
    const festival = solarFestival || lunar.getFestivals()[0] || ''

    // 农历 / 黄历信息
    const lunarText = `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
    const chongDesc = lunar.getDayChongDesc()
    const chongSha = chongDesc ? `${chongDesc} 煞${lunar.getDaySha()}` : `煞${lunar.getDaySha()}`

    this.setData({
      solarDate: dateStr,
      dateText: String(d.getDate()),
      yearText: String(d.getFullYear()),
      monthText: String(d.getMonth() + 1),
      weekday: WEEKDAYS[d.getDay()],
      relativeDay,
      festival,
      lunarText,
      jieQi: lunar.getJieQi(),
      yiDate,
      todayFortune: getTodayFortune(yiDate.dayZodiacIndex),
      kuJior: getKujior().kujior,
      laSe: getLaSe(dateStr),
      zeta: getZeTa(dateStr),
      yearGanZhi: lunar.getYearInGanZhi(),
      shengXiao: lunar.getYearShengXiao(),
      dayGanZhi: lunar.getDayInGanZhi(),
      naYin: lunar.getDayNaYin(),
      chongSha,
      lunarYi: lunar.getDayYi().slice(0, 4).join(' · '),
      lunarJi: lunar.getDayJi().slice(0, 4).join(' · '),
      yueXiang: lunar.getYueXiang(),
      zhiXing: lunar.getZhiXing(),
      dayTianShen: lunar.getDayTianShen(),
      xiu: lunar.getXiu(),
      xiuLuck: lunar.getXiuLuck(),
      xunKong: lunar.getDayXunKong(),
      pengZu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
      jiShen: lunar.getDayJiShen().slice(0, 4).join(' · ') || '无',
      xiongSha: lunar.getDayXiongSha().slice(0, 4).join(' · ') || '无',
      posXi: lunar.getDayPositionXi(),
      posFu: lunar.getDayPositionFu(),
      posCai: lunar.getDayPositionCai(),
      posYangGui: lunar.getDayPositionYangGui(),
      posYinGui: lunar.getDayPositionYinGui(),
      // 当日八字：年月以立春、节气为界（EightChar 内部使用交节精确算法）
      baZi: `${lunar.getEightChar().getYear()}年 · ${lunar.getEightChar().getMonth()}月 · ${lunar.getEightChar().getDay()}日 · ${lunar.getEightChar().getTime()}时`
    })
  },

  /**
   * picker 选择任意日期
   */
  onDateChange(e: WechatMiniprogram.CustomEvent) {
    this.selectDate(e.detail.value)
  },

  /**
   * 前一天
   */
  prevDay() {
    const d = parse(this.currentDate)
    d.setDate(d.getDate() - 1)
    this.selectDate(fmt(d))
  },

  /**
   * 后一天
   */
  nextDay() {
    const d = parse(this.currentDate)
    d.setDate(d.getDate() + 1)
    this.selectDate(fmt(d))
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.selectDate(fmt(new Date()))
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
