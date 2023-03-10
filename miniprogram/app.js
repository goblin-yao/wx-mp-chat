//app.js
App({
  onLaunch() {
    this.InitCloud(); //初始化云服务 / ESC
    this.InitCustom(); //初始化custom所需配置信息
  },
  InitCloud() {
    wx.cloud.init();
  },
  InitCustom() {
    let _e = wx.getSystemInfoSync();

    console.log("getSystemInfoSync=>", _e);
    this.globalData.systemInfo = _e;
    this.globalData.StatusBar = _e.statusBarHeight;
    let custom = wx.getMenuButtonBoundingClientRect();
    // console.log(custom)
    this.globalData.Custom = custom;
    this.globalData.CustomBar = custom.bottom + custom.top - _e.statusBarHeight;
    this.globalData.safeBottomLeft = _e.screenHeight - _e.safeArea.bottom;
  },
  globalData: {
    curResPromise: null, //当前的Promise，用来abort
    curUserQuestion: "", //用户当前的提问，用来重新发送
  },
});
