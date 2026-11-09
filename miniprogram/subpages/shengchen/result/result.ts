// subpages/shengchen/result/result.ts
// 生辰结果：展示查询人出生时的彝历生辰、农历生辰与生辰八字。
import {
  getKujior,
  getLaSe,
  getYiTaBoo,
  getZeTa,
  getShiChen,
  getYearInfo,
  getXingxiu,
  getXiDe
} from '../../../plugin/yi-lunar/index'
import { Solar } from '../../libs/lunar-typescript'
import { getMonthStartIndex } from '../../../utils/settings'

/** 彝文/中文成对的展示项 */
interface YiPair {
  yi: string
  cn: string
}

/** 八字单柱 */
interface Pillar {
  label: string
  ganZhi: string
  wuXing: string
  naYin: string
}

/** 取数组对 [彝文, 中文] */
function pair(v: Array<string | undefined> | undefined): YiPair {
  return { yi: (v && v[0]) || '', cn: (v && v[1]) || '' }
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    motherBirthYear: 0,
    yiYear: {} as YiPair,
    yiMonth: {} as YiPair,
    yiDay: {} as YiPair,
    yiMoon: {} as YiPair,
    tabooSon: {} as YiPair,
    tabooMon: {} as YiPair,
    tabooFat: {} as YiPair,
    kuJior: {} as YiPair,
    laSe: {} as YiPair,
    zeta: {} as YiPair,
    shichen: {} as YiPair,
    shichenName: '',
    xiDe: [] as string[],
    yearInfo: {} as {
      suizhiXing: string[]
      yinYang: string[]
      wuXing: string[]
      jiSheng: string[]
    },
    lunarText: '',
    pillars: [] as Pillar[],
    baziText: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(query: Record<string, string>) {
    // 校验已在表单页「查询生辰」时完成，此处仅记录查询条件并计算
    const motherBirthYear = Number(query.by || 0)
    const date = String(query.date || '')
    const time = String(query.time || '')
    this.setData({ motherBirthYear })
    this.renderResult(date, time)
  },

  /** 计算并展示出生时刻的彝历、农历与八字 */
  renderResult(date: string, time: string) {
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    const monthStart = getMonthStartIndex()

    const yi = getYiTaBoo(date, monthStart)
    const ku = getKujior(date).kujior
    const laSe = getLaSe(date)
    const zeta = getZeTa(date) || ['', '']

    // 农历与八字：按出生日期时刻换算，年月以立春、节气为界（EightChar 内部使用交节精确算法）
    const lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar()
    const ec = lunar.getEightChar()
    const shichen = getShiChen(`${date} ${time}`)
    const yearInfo = getYearInfo(date)

    this.setData({
      yiYear: pair(yi.year),
      yiMonth: pair(yi.month),
      yiDay: pair(yi.day),
      yiMoon: pair(yi.dayMoon),
      tabooSon: pair(yi.tabooSon),
      tabooMon: pair(yi.tabooMon),
      tabooFat: pair(yi.tabooFat),
      shichen: pair(shichen.yi),
      shichenName: shichen.cn,
      xingxiu:getXingxiu(date),
      xiDe: getXiDe(y - this.data.motherBirthYear + 1, true),
      yearInfo,
      kuJior: { yi: ku[0], cn: ku[1] },
      laSe: { yi: laSe[0], cn: laSe[1] },
      zeta: { yi: zeta[0], cn: zeta[1] },
      lunarText: `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      pillars: [
        { label: '年柱', ganZhi: ec.getYear(), wuXing: ec.getYearWuXing(), naYin: ec.getYearNaYin() },
        { label: '月柱', ganZhi: ec.getMonth(), wuXing: ec.getMonthWuXing(), naYin: ec.getMonthNaYin() },
        { label: '日柱', ganZhi: ec.getDay(), wuXing: ec.getDayWuXing(), naYin: ec.getDayNaYin() },
        { label: '时柱', ganZhi: ec.getTime(), wuXing: ec.getTimeWuXing(), naYin: ec.getTimeNaYin() }
      ],
      baziText: `${ec.getYear()} ${ec.getMonth()} ${ec.getDay()} ${ec.getTime()}`
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '彝族生活日历 · 生辰查询',
      path: '/pages/index/index'
    }
  }
})
