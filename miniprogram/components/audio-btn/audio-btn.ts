// components/audio-btn/audio-btn.ts
// 音频播放按钮组件：封装 YiAudioPlayer 与播放动画，
// 传入 date（YYYY-MM-DD）即可播放对应的彝历语音。
import { YiAudioPlayer } from '../../utils/howler'

/** 组件实例 → 播放器，挂在模块级 WeakMap 上，避免把播放器放进可序列化的 data */
const players = new WeakMap<object, YiAudioPlayer>()

function getPlayer(ctx: object): YiAudioPlayer | null {
  return players.get(ctx) || null
}

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
      const player = getPlayer(this)
      if (player && player.isPlaying) player.stop()
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      players.set(this, new YiAudioPlayer({
        onPlayingChange: (playing) => this.setData({ playing })
      }))
    },
    detached() {
      const player = getPlayer(this)
      if (player) player.destroy()
      players.delete(this)
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /** 播放 / 停止当前日期的彝历语音 */
    toggleAudio() {
      const player = getPlayer(this)
      if (!player || !this.data.date) return
      if (player.isPlaying) {
        player.stop()
        return
      }
      player.play(this.data.date)
    },

    /**
     * 自动播放：供页面在开启「自动播放」时调用。
     * 可显式传入日期，避免页面 setData 与组件属性同步的时序问题。
     */
    playDate(date?: string) {
      const player = getPlayer(this)
      const target = date || this.data.date
      if (!player || !target) return
      if (player.isPlaying) player.stop()
      player.play(target)
    },

    /** 停止当前播放（页面隐藏时调用） */
    stopAudio() {
      const player = getPlayer(this)
      if (player && player.isPlaying) player.stop()
    }
  }
})
