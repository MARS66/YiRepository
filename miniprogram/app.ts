// app.ts
App<IAppOption>({
  globalData: {
    statusBarHeight: 0,
    navHeight: 0,
    totalNavHeight: 0,
    menuButton: {},
  },
  onLaunch() {
    // 获取窗口信息（getSystemInfoSync 已废弃，改用 getWindowInfo）
    const systemInfo = wx.getSystemInfoSync();
    // 获取胶囊按钮信息
    const menuButton = wx.getMenuButtonBoundingClientRect();

    // 1. 状态栏高度
    const statusBarHeight = systemInfo.statusBarHeight;
    // 2. 导航栏内容高度（与胶囊高度一致）
    const navHeight = menuButton.height;
    // 3. 计算导航栏总高度
    const totalNavHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height + statusBarHeight;
    // 存入全局数据，供页面和组件使用
    this.globalData.statusBarHeight = statusBarHeight;
    this.globalData.navHeight = navHeight;
    this.globalData.menuButton = menuButton;
    this.globalData.totalNavHeight = totalNavHeight;
  },
})
