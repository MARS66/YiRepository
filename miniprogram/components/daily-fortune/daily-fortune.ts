// components/daily-fortune/daily-fortune.ts
// 宜忌卡片组件：展示当日忌/宜词与说明，
// 供首页、日历等页面共用。传入 fortune（{ taboo: [忌, 宜], tabooFull: 说明 }）。
import { playPhraseAudio } from '../../utils/audio'

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    /** 卡片标题 */
    title: {
      type: String,
      value: '今日宜忌'
    },
    /** 今日宜忌数据：{ taboo: [string, string], tabooFull: string } */
    fortune: {
      type: Object,
      value: {}
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
    /** 点击卡片，播放彝语读音（忌词 taboo[0]） */
    onTap() {
      const taboo = (this.data.fortune as { taboo?: string[] }).taboo
      if (!taboo || taboo.length === 0) return
      playPhraseAudio(taboo[0])
    }
  }
})
