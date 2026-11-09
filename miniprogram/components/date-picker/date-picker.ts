// components/date-picker/date-picker.ts
// 通用日期选择组件：底部弹出年/月/日三列滚轮选择器，
// 供生辰查询、彝历查询等页面共用。页面通过 visible 控制开关，
// 确认后触发 confirm 事件（detail.date 为 YYYY-MM-DD），取消触发 cancel。
/** 数字补零 */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    /** 是否显示（开关状态由页面持有） */
    visible: {
      type: Boolean,
      value: false
    },
    /** 当前选中日期 YYYY-MM-DD，打开时作为初始值 */
    value: {
      type: String,
      value: ''
    },
    /** 最小可选年份（含） */
    minYear: {
      type: Number,
      value: 1900
    },
    /** 最大可选年份（含），默认今年 */
    maxYear: {
      type: Number,
      value: 0
    },
    /** 弹层标题 */
    title: {
      type: String,
      value: '选择日期'
    },
    /** 弹层眉标 */
    eyebrow: {
      type: String,
      value: 'DATE'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    years: [] as number[],
    months: [] as number[],
    days: [] as number[],
    pickerValue: [0, 0, 0] as number[]
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      const months: number[] = []
      for (let m = 1; m <= 12; m++) months.push(m)
      this.setData({ months })
    }
  },

  /**
   * 属性变化：打开弹层或年份范围变化时重新定位滚轮
   */
  observers: {
    visible(v: boolean) {
      if (v) this.syncInitial()
    },
    'minYear, maxYear'() {
      this.syncInitial()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /** 阻止弹层内的滑动穿透 */
    noop() {},

    /** 某年某月的天数（month 为 1-12） */
    daysInMonth(year: number, month: number): number {
      return new Date(year, month, 0).getDate()
    },

    /** 构建年数组 */
    buildYears(): number[] {
      const maxYear = this.data.maxYear || new Date().getFullYear()
      const minYear = Math.min(this.data.minYear, maxYear)
      const years: number[] = []
      for (let y = minYear; y <= maxYear; y++) years.push(y)
      return years
    },

    /** 构建某年某月的日数组 */
    buildDays(year: number, month: number): number[] {
      const days: number[] = []
      for (let d = 1; d <= this.daysInMonth(year, month); d++) days.push(d)
      return days
    },

    /** 打开弹层或年份范围变化时：重建年列并定位初始值（默认今天，越界就近夹取） */
    syncInitial() {
      const years = this.buildYears()
      const { value } = this.data
      const now = new Date()
      let y = now.getFullYear()
      let m = now.getMonth() + 1
      let d = now.getDate()
      if (value) {
        const parts = value.split('-').map(Number)
        if (parts.length === 3) {
          y = parts[0]
          m = parts[1]
          d = parts[2]
        }
      }
      if (y < years[0]) y = years[0]
      if (y > years[years.length - 1]) y = years[years.length - 1]
      this.setData({
        years,
        days: this.buildDays(y, m),
        pickerValue: [years.indexOf(y), m - 1, Math.min(d, this.daysInMonth(y, m)) - 1]
      })
    },

    /** 弹层内滚动年/月/日：年或月变化时按实际天数刷新日列 */
    onPickerChange(e: WechatMiniprogram.CustomEvent<{ value: number[] }>) {
      const value = (e.detail.value || []).map(Number)
      const prev = this.data.pickerValue
      const changed = value[0] !== prev[0] || value[1] !== prev[1]
      const days = changed
        ? this.buildDays(this.data.years[value[0]], value[1] + 1)
        : this.data.days
      this.setData({
        pickerValue: [value[0], value[1], Math.min(value[2], days.length - 1)],
        days
      })
    },

    /** 取消 */
    onCancel() {
      this.triggerEvent('cancel')
    },

    /** 确定：携带选中日期 YYYY-MM-DD */
    onConfirm() {
      const { pickerValue, years } = this.data
      const [yi, mi, di] = pickerValue
      const y = years[yi]
      const m = mi + 1
      const d = di + 1
      this.triggerEvent('confirm', { date: `${y}-${pad2(m)}-${pad2(d)}` })
    }
  }
})
