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

/** yi-detail 组件条目：{ yi, cn, valueYi, valueCn } */
interface DetailItem {
  yi: string
  cn: string
  valueYi: string
  valueCn: string
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
    isDark: (wx.getStorageSync('yi-theme') || 'dark') === 'dark',
    motherBirthYear: 0,
    birthDate: '',
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
    yearInfo: {} as {
      suizhiXing: string[]
      yinYang: string[]
      wuXing: string[]
      jiSheng: string[]
    },
    detailItems: [] as DetailItem[],
    lunarText: '',
    pillars: [] as Pillar[],
    baziText: ''
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
  onLoad(query: Record<string, string>) {
    // 校验已在表单页「查询生辰」时完成，此处仅记录查询条件并计算
    const motherBirthYear = Number(query.by || 0)
    const date = String(query.date || '')
    const time = String(query.time || '')
    this.setData({ motherBirthYear, birthDate: date })
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
    const xiDe = getXiDe(y - this.data.motherBirthYear + 1, true)
    const xingxiu = getXingxiu(date)

    // 农历与八字：按出生日期时刻换算，年月以立春、节气为界（EightChar 内部使用交节精确算法）
    const lunar = Solar.fromYmdHms(y, m, d, hh, mm, 0).getLunar()
    const ec = lunar.getEightChar()
    const shichen = getShiChen(`${date} ${time}`)
    const yearInfo = getYearInfo(date)

    // yi-detail 组件条目（{ yi, cn, valueYi, valueCn }）
    const tabooSon = pair(yi.tabooSon)
    const tabooMon = pair(yi.tabooMon)
    const tabooFat = pair(yi.tabooFat)
    const kuJior: YiPair = { yi: ku[0], cn: ku[1] }
    const laSePair: YiPair = { yi: laSe[0], cn: laSe[1] }
    const zetaPair: YiPair = { yi: zeta[0], cn: zeta[1] }
    const detailItems: DetailItem[] = [
      { yi: 'ꑞꅉ', cn: '方位', valueYi: xiDe[0], valueCn: xiDe[1] },
      { yi: 'ꇗꊖ', cn: '五行', valueYi: yearInfo.wuXing[0], valueCn: yearInfo.wuXing[1] },
      { yi: 'ꈋꈌ', cn: '阴阳', valueYi: yearInfo.yinYang[0], valueCn: yearInfo.yinYang[1] },
      { yi: 'ꐰꇑ', cn: '吉神', valueYi: yearInfo.jiSheng[0], valueCn: yearInfo.jiSheng[1] },
      { yi: 'ꈎꏸ', cn: '岁星', valueYi: yearInfo.suizhiXing[0], valueCn: yearInfo.suizhiXing[1] },
      { yi: 'ꄤꁨꌺ', cn: '塔博惹', valueYi: tabooSon.yi, valueCn: tabooSon.cn },
      { yi: 'ꄤꁨꀋꃀ', cn: '母塔博', valueYi: tabooMon.yi, valueCn: tabooMon.cn },
      { yi: 'ꄤꁨꀋꀮ', cn: '公塔博', valueYi: tabooFat.yi, valueCn: tabooFat.cn },
      { yi: 'ꈐꐡ', cn: '库觉', valueYi: kuJior.yi, valueCn: kuJior.cn },
      { yi: 'ꍀꌋ', cn: '日色', valueYi: xingxiu.yi, valueCn: xingxiu.cn },
      { yi: 'ꆿꌋ', cn: '狼色', valueYi: laSePair.yi, valueCn: laSePair.cn },
      { yi: 'ꃅꌋꋠꑍ', cn: '木色则尼', valueYi: zetaPair.yi, valueCn: zetaPair.cn }
    ]

    this.setData({
      yiYear: pair(yi.year),
      yiMonth: pair(yi.month),
      yiDay: pair(yi.day),
      yiMoon: pair(yi.dayMoon),
      tabooSon,
      tabooMon,
      tabooFat,
      shichen: pair(shichen.yi),
      shichenName: shichen.cn,
      yearInfo,
      kuJior,
      laSe: laSePair,
      zeta: zetaPair,
      detailItems,
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
      title: '彝族生活日历 · 生辰推算',
      path: '/pages/index/index'
    }
  }
})
