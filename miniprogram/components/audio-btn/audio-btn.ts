// components/audio-btn/audio-btn.ts
// 音频播放按钮组件：封装 YiAudioPlayer 与播放动画，
// 传入 date（YYYY-MM-DD）即可播放对应的彝历语音。
import { YiAudioPlayer } from '../../utils/howler'

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    /** 要播放的日期 YYYY-MM-DD */
    date: {
      type: String,
      value: ''
    },
    /** 按钮颜色：fire（火色，默认）/ gold（金色） */
    color: {
      type: String,
      value: 'fire'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    playing: false
  },

  /**
   * 属性变化：切换日期时停止正在播放的旧日期语音
   */
  observers: {
    date() {
      if (this.player && this.player.isPlaying) this.player.stop()
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.player = new YiAudioPlayer({
        onPlayingChange: (playing) => this.setData({ playing })
      })
    },
    detached() {
      if (this.player) {
        this.player.destroy()
        this.player = null
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /** 播放 / 停止当前日期的彝历语音 */
    toggleAudio() {
      if (!this.player || !this.data.date) return
      if (this.player.isPlaying) {
        this.player.stop()
        return
      }
      this.player.play(this.data.date)
    }
  }
})
