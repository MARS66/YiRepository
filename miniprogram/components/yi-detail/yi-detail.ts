// components/yi-detail/yi-detail.ts
// 彝历详情卡片组件：展示当日彝历术语（塔博惹、库觉、狼色等）双语对照网格，
// 供首页、日历等页面共用。传入 items（{ yi, cn, valueYi, valueCn } 数组）。
import { playPhraseAudio } from '../../utils/audio'

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    /** 卡片标题 */
    title: {
      type: String,
      value: '彝历详情'
    },
    /** 彝历术语项：{ yi: 彝文, cn: 中文, valueYi: 值彝文, valueCn: 值中文 } */
    items: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /** 点击术语项，播放彝语读音（yi + valueYi 拼成词组） */
    onTapItem(e: WechatMiniprogram.TouchEvent) {
      const item = e.currentTarget.dataset.item as string | undefined
      if (!item) return
      playPhraseAudio(item)
    }
  }
})
