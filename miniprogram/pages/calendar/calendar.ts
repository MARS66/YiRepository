// pages/calendar/calendar.ts
import { getYiTaBoo, getKujior,getLaSe,getZeTa,getYearInfo,
  getXingxiu,getTodayFortune } from '../../plugin/yi-lunar/index'
import { getFestival } from 'chinese-workday'
import { isAutoAudio, getMonthStartIndex } from '../../utils/settings'

/**
 * 火把节起始日对照表：每年农历六月二十四对应的阳历月日（1900-2100）。
 * 由 lunar-typescript 预生成，避免整份农历库（约 415KB）被打入主包。
 */
const TORCH_SOLAR: Record<number, string> = {
  1900: '7-20', 1901: '8-8', 1902: '7-28', 1903: '8-16', 1904: '8-5',
  1905: '7-26', 1906: '8-13', 1907: '8-2', 1908: '7-22', 1909: '8-9',
  1910: '7-30', 1911: '7-19', 1912: '8-6', 1913: '7-27', 1914: '8-15',
  1915: '8-4', 1916: '7-23', 1917: '8-11', 1918: '7-31', 1919: '7-21',
  1920: '8-8', 1921: '7-28', 1922: '8-16', 1923: '8-6', 1924: '7-25',
  1925: '8-13', 1926: '8-2', 1927: '7-22', 1928: '8-9', 1929: '7-30',
  1930: '7-19', 1931: '8-7', 1932: '7-27', 1933: '8-15', 1934: '8-4',
  1935: '7-24', 1936: '8-10', 1937: '7-31', 1938: '7-21', 1939: '8-9',
  1940: '7-28', 1941: '7-18', 1942: '8-5', 1943: '7-25', 1944: '8-12',
  1945: '8-1', 1946: '7-22', 1947: '8-10', 1948: '7-30', 1949: '7-19',
  1950: '8-7', 1951: '7-27', 1952: '8-14', 1953: '8-3', 1954: '7-23',
  1955: '8-11', 1956: '7-31', 1957: '7-21', 1958: '8-9', 1959: '7-29',
  1960: '7-17', 1961: '8-5', 1962: '7-25', 1963: '8-13', 1964: '8-1',
  1965: '7-22', 1966: '8-10', 1967: '7-31', 1968: '7-19', 1969: '8-6',
  1970: '7-26', 1971: '8-14', 1972: '8-3', 1973: '7-23', 1974: '8-11',
  1975: '8-1', 1976: '7-20', 1977: '8-8', 1978: '7-28', 1979: '7-17',
  1980: '8-4', 1981: '7-25', 1982: '8-13', 1983: '8-2', 1984: '7-22',
  1985: '8-10', 1986: '7-30', 1987: '7-19', 1988: '8-6', 1989: '7-26',
  1990: '8-14', 1991: '8-4', 1992: '7-23', 1993: '8-11', 1994: '8-1',
  1995: '7-21', 1996: '8-8', 1997: '7-28', 1998: '8-15', 1999: '8-5',
  2000: '7-25', 2001: '8-13', 2002: '8-2', 2003: '7-23', 2004: '8-9',
  2005: '7-29', 2006: '7-19', 2007: '8-6', 2008: '7-26', 2009: '8-14',
  2010: '8-4', 2011: '7-24', 2012: '8-11', 2013: '7-31', 2014: '7-20',
  2015: '8-8', 2016: '7-27', 2017: '7-17', 2018: '8-5', 2019: '7-26',
  2020: '8-13', 2021: '8-2', 2022: '7-22', 2023: '8-10', 2024: '7-29',
  2025: '7-18', 2026: '8-6', 2027: '7-27', 2028: '8-14', 2029: '8-3',
  2030: '7-24', 2031: '8-11', 2032: '7-30', 2033: '7-20', 2034: '8-8',
  2035: '7-28', 2036: '7-17', 2037: '8-5', 2038: '7-25', 2039: '8-13',
  2040: '8-1', 2041: '7-21', 2042: '8-9', 2043: '7-30', 2044: '7-18',
  2045: '8-6', 2046: '7-27', 2047: '8-15', 2048: '8-3', 2049: '7-23',
  2050: '8-11', 2051: '7-31', 2052: '7-20', 2053: '8-8', 2054: '7-28',
  2055: '7-18', 2056: '8-5', 2057: '7-25', 2058: '8-12', 2059: '8-2',
  2060: '7-21', 2061: '8-9', 2062: '7-30', 2063: '7-19', 2064: '8-6',
  2065: '7-27', 2066: '8-14', 2067: '8-3', 2068: '7-22', 2069: '8-10',
  2070: '7-31', 2071: '7-21', 2072: '8-8', 2073: '7-28', 2074: '7-17',
  2075: '8-5', 2076: '7-24', 2077: '8-12', 2078: '8-1', 2079: '7-22',
  2080: '8-9', 2081: '7-30', 2082: '7-19', 2083: '8-7', 2084: '7-26',
  2085: '8-14', 2086: '8-3', 2087: '7-23', 2088: '8-10', 2089: '7-31',
  2090: '7-21', 2091: '8-8', 2092: '7-28', 2093: '7-17', 2094: '8-4',
  2095: '7-25', 2096: '8-12', 2097: '8-1', 2098: '7-22', 2099: '8-10',
  2100: '7-30',
}

/** 火把节起始日：每年农历六月二十四对应的阳历日期 */
function getTorchStart(year: number): Date {
  const md = TORCH_SOLAR[year] || '8-7'; // 超出对照表年份时按近似值兜底
  const [month, day] = md.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 彝族年：每年阳历 11月20日-26日（7 天） */
function isYiYear(d: Date): boolean {
  return d.getMonth() === 10 && d.getDate() >= 20 && d.getDate() <= 26;
}

/** 格式化为 YYYY-MM-DD */
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type CalendarMark = {
  date?: string | number | Date;      // 或 year/month/day
  type: 'schedule' | 'corner' | 'festival' | 'solar';
  text: string;
        year: string | number;
        month: string | number;
        day: string | number;
  style?: string | Record<string, string | number>;
};
/** 最近一次渲染的日期范围，主题切换时用于重建标记 */
let lastRange: Array<{ year: number; month: number; day: number }> = [];
/** 当前选中日期：周末红色标记需避开选中日期，以保留选中态白字 */
let checkedDate: { year: number; month: number; day: number } | null = null;

/** 彝历详情术语项：{ yi: 彝文, cn: 中文, valueYi: 值彝文, valueCn: 值中文 } */
interface DetailItem {
  yi: string;
  cn: string;
  valueYi: string;
  valueCn: string;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    yiDate:{} as any,
    todayFortune: { taboo: [], tabooFull: '' } as any,
    calendarAreas: ['header', 'title', 'subinfo', 'viewbar','dragbar','today'],
    isDark: false,
    calendarStyle: 'width: 100%; --wc-primary: #9c2d25; --wc-bg-light: #fffdf7; --wc-title-color-light: #201d18; --wc-title-size: 40rpx; --wc-week-color-light: #70695e; --wc-week-size: 20rpx; --wc-date-color-light: #201d18; --wc-date-size: 32rpx; --wc-today-color-light: #9c2d25; --wc-solar-color-light: #aa7b2d; --wc-mark-color-light: #201d18ca; --wc-mark-size: 22rpx; --wc-corner-size: 12rpx; --wc-checked-bg-light: #9c2d25; --wc-checked-color-light: #ffffff; --wc-checked-mark-color-light: #ffffff; --wc-checked-today-bg-light: #9c2d25; --wc-checked-today-color-light: #ffffff; --wc-bg-dark: #2b2923; --wc-title-color-dark: #f6f0e4; --wc-week-color-dark: #bdb4a6; --wc-date-color-dark: #f6f0e4; --wc-today-color-dark: #de6659; --wc-solar-color-dark: #dab061; --wc-mark-color-dark: #f6f0e4; --wc-checked-bg-dark: #de6659; --wc-checked-color-dark: #ffffff; --wc-checked-mark-color-dark: #ffffff; --wc-checked-today-bg-dark: #de6659; --wc-checked-today-color-dark: #ffffff; --wc-annual-bottom-height: 0px;',
    marks: [] as Array<CalendarMark>,
    selectedLabel: '9月1日 · 星期二',
    detailItems: [] as DetailItem[],
    relativeDay: '今天',
    solarDate: '',
    monthStart: 0
  },

  /**
   * 日历加载完成
   */
  onCalendarLoad(e: WechatMiniprogram.CustomEvent) {
    if (e.detail.checked) this.updateSelected(e.detail.checked);
    this.buildMarks(e.detail.range);
  },

  /**
   * 日期点击
   */
  onCalendarClick(e: WechatMiniprogram.CustomEvent) {
    this.updateSelected(e.detail.checked);
    // 自动播放：点选日期后立即播报该日彝历语音
    if (isAutoAudio()) {
      // 等组件属性同步完成后再播放，避免 date observer 把新播放停掉
      wx.nextTick(() => {
        const audio = this.selectComponent('#page-audio');
        if (audio && this.data.solarDate) audio.playDate(this.data.solarDate);
      });
    }
  },

  /**
   * 日期选中变化
   */
  onCalendarChange(e: WechatMiniprogram.CustomEvent) {
    this.updateSelected(e.detail.checked);
    this.buildMarks(e.detail.range);
  },

  /**
   * 为当前渲染范围内的每一天生成标记
   * - festival（日期下方小字）：节假日显示节日名称（法定节假日 + 火把节 + 彝族年），其余显示彝族生肖（彝文+中文），节假日红色醒目
   * - corner（右上角标）：休息日显示「休」，工作日显示月暗彝文；右侧留 4rpx 间距避免与日期数字重叠，节假日红色醒目
   * - solar（日期数字）：周六、周日及节假日显示为红色 #dd442f（当前选中日期除外，保留选中态白字）
   * 说明：组件中 'solar' 类型会替换日期数字，日期下方小字由 'festival' 类型驱动
   */
  buildMarks(range: Array<{ year: number; month: number; day: number }>) {
    if (!range || range.length < 2) return;
    lastRange = range;
    const [start, end] = range;
    const marks: Array<CalendarMark> = [];
    const cur = new Date(start.year, start.month - 1, start.day);
    const last = new Date(end.year, end.month - 1, end.day);

    // 计算范围内每年火把节起始日
    const torch = new Map<number, Date>();
    for (let y = start.year; y <= end.year; y++) {
      const ts = getTorchStart(y);
      torch.set(y, ts);
    }

    while (cur.getTime() <= last.getTime()) {
      const year = cur.getFullYear();
      const month = cur.getMonth() + 1;
      const day = cur.getDate();
      const dateStr = fmt(cur);
      const yi = getYiTaBoo(dateStr, this.data.monthStart);
      const ts = torch.get(year)!;
      const te = new Date(ts);
      te.setDate(ts.getDate() + 6);
      const lsName = cur >= ts && cur <= te
        ? '火把节'
        : isYiYear(cur) ? '彝族年' : '';
      const festival = getFestival(dateStr); // '国庆节' | '周末' | '工作日' | '补春节'
      const isFestival = lsName
        ? true
        : festival !== '周末' && festival !== '工作日' && !festival.startsWith('补');
      // 休息日判定：仅节假日（火把节/彝族年/国家法定节假日）显示「休」；
      // 普通周末、调休补班的周末正常显示月暗彝文
      const isRest = isFestival;
      // 节假日用红色醒目，其余为默认黑色
      const festivalStyle = isFestival
        ? `color: ${this.data.isDark ? '#e05a50' : '#dd442f'};font-size: 20rpx;font-weight: 400;`
        : 'font-weight: 400; font-size: 22rpx;';
      marks.push({
        year, month, day,
        type: 'festival',
        text: isFestival ? (lsName || festival) : yi.day.join(''),
        style: festivalStyle || undefined
      });
      // corner 右侧留 4rpx 间距，避免与日期数字重叠；节假日同 festival 红色
      const cornerStyle = isFestival ? `right: -32rpx;color: ${this.data.isDark ? '#e05a50' : '#dd442f'};font-size: 20rpx;font-weight: 400;` :
       `right: -32rpx; font-size: 20rpx;font-weight: 400;`;
      marks.push({
        year, month, day,
        type: 'corner',
        text: isRest ? '休' : yi.dayMoon[0],
        style: cornerStyle
      });
      // 周末及节假日日期数字显示红色 #dd442f；当前选中日期跳过，保留组件选中态白字
      const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
      const isChecked = checkedDate !== null
        && checkedDate.year === year && checkedDate.month === month && checkedDate.day === day;
      if ((isWeekend || isFestival) && !isChecked) {
        marks.push({ year, month, day, type: 'solar', text: String(day), style: 'color: #dd442f;' });
      }
      cur.setDate(cur.getDate() + 1);
    }
    this.setData({ marks });
  },

  /**
   * 更新选中日期展示
   */
  updateSelected(checked: { year: number; month: number; day: number }) {
    checkedDate = checked;

    const d = new Date(checked.year, checked.month - 1, checked.day);
    const today = new Date();
    const yiDate = getYiTaBoo(fmt(d), this.data.monthStart);
    const kuJior = getKujior().kujior as string[];
    const laSe = getLaSe(fmt(d)) as string[];
    const zeta = getZeTa(fmt(d)) as string[];
    const xingxiu = getXingxiu(fmt(d)) as any;
    // 按自然日计算与今天的差值（忽略时分秒），得出「今天 / N天前 / N天后」
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.round((d0.getTime() - today0.getTime()) / 86400000);
    const relativeDay = diff === 0 ? '今天' : diff < 0 ? `${-diff}天前` : `${diff}天后`;
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const yearInfo = getYearInfo(fmt(d));
    this.setData({
      yiDate,
      todayFortune: getTodayFortune(yiDate.dayZodiacIndex),
      selectedLabel: `${checked.year}年${checked.month}月${checked.day}日 · 星期${weekdays[d.getDay()]}`,
      relativeDay,
      solarDate: fmt(d),
      detailItems: [
        { yi: 'ꈐꐡ', cn: '库觉', valueYi: kuJior[0], valueCn: kuJior[1] },
        { yi: 'ꍀꌋ', cn: '日色', valueYi: xingxiu.yi, valueCn: xingxiu.cn },
        { yi: 'ꆿꌋ', cn: '狼色', valueYi: laSe[0], valueCn: laSe[1] },
        { yi: 'ꃅꌋꋠꑍ', cn: '木色则尼', valueYi: zeta[0], valueCn: zeta[1] },
        { yi: 'ꄤꁨꌺ', cn: '塔博惹', valueYi: yiDate.tabooSon[0], valueCn: yiDate.tabooSon[1] },
        { yi: 'ꄤꁨꀋꃀ', cn: '塔博阿莫', valueYi: yiDate.tabooMon[0], valueCn: yiDate.tabooMon[1] },
        { yi: 'ꄤꁨꀋꀮ', cn: '塔博阿补', valueYi: yiDate.tabooFat[0], valueCn: yiDate.tabooFat[1] },

        { yi: 'ꈎꏸ', cn: '值星', valueYi: yearInfo.suizhiXing[0], valueCn: yearInfo.suizhiXing[1] }
      ]
    });
  },

  /**
   * 主题切换（由 layout 组件触发）
   */
  onThemeChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ isDark: e.detail.isDark });
    // 节假日红色随主题变化，需重建标记
    if (lastRange.length) this.buildMarks(lastRange);
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.setData({
      isDark: wx.getStorageSync('yi-theme') === 'dark',
      monthStart: getMonthStartIndex()
    });
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
    // 「我的」页面修改起始月份后，返回日历时同步重建选中日期与标记
    const monthStart = getMonthStartIndex();
    if (monthStart !== this.data.monthStart) {
      this.setData({ monthStart });
      if (checkedDate) this.updateSelected(checkedDate);
      if (lastRange.length) this.buildMarks(lastRange);
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    const audio = this.selectComponent('#page-audio');
    if (audio) audio.stopAudio();
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