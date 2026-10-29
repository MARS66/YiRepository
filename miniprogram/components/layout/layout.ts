// components/navigation-bar/navigation-bar.ts
const globalData=getApp().globalData
const THEME_KEY='yi-theme'
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    title:{
      type: String,
      value: '彝族生活日历'
    },
    eyebrow:{
      type: String,
      value: 'YI LIFE CALENDAR'
    },
    needBack:{
      type: Boolean,
      value: true
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    light:'☀',
    dark:'◐',
    isDark:false,
    menu:globalData.menuButton,
    statusBarHeight: globalData.statusBarHeight,
    navHeight: globalData.navHeight,
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.applyTheme(wx.getStorageSync(THEME_KEY)==='dark', false)
    }
  },

  /**
   * 页面生命周期：tabBar 页面常驻内存，切换回来时重新同步主题
   */
  pageLifetimes: {
    show() {
      const storedDark = wx.getStorageSync(THEME_KEY)==='dark'
      if (storedDark !== this.data.isDark) {
        this.applyTheme(storedDark, false)
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onBack(){
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
      this.triggerEvent('back')
    },
    onToggleTheme(){
      this.applyTheme(!this.data.isDark)
    },
    applyTheme(isDark: boolean, showTip = true){
      this.setData({ isDark })
      const theme = isDark ? 'dark' : 'light'
      wx.setStorageSync(THEME_KEY, theme)
      globalData.theme = theme
      wx.setTabBarStyle(isDark
        ? { backgroundColor: '#2b2923', color: '#9e9588', selectedColor: '#9c2d25', borderStyle: 'black' }
        : { backgroundColor: '#fffdf7', color: '#70695e', selectedColor: '#9c2d25', borderStyle: 'white' })
      this.triggerEvent('themechange', { isDark })
      if (showTip) {
        wx.showToast({ title: isDark ? '已切换深色模式' : '已切换浅色模式', icon: 'none' })
      }
    }
  }
})