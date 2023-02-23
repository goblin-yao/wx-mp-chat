//app.js
const config = require("config");
const Cloud = require("common/util/cloud-call");
App({
  onLaunch: function () {
    this.InitCloud(); //初始化云服务 / ESC
    this.InitCustom(); //初始化custom所需配置信息
  },
  InitCloud() {
    wx.cloud.init({
      env: config.CloudID,
      traceUser: true,
    });
  },
  InitCustom() {
    let _e = wx.getSystemInfoSync()

    console.log('getSystemInfoSync=>', _e)
    this.globalData.systemInfo = _e
    this.globalData.StatusBar = _e.statusBarHeight;
    let custom = wx.getMenuButtonBoundingClientRect();
    // console.log(custom)
    this.globalData.Custom = custom;
    this.globalData.CustomBar =
      custom.bottom + custom.top - _e.statusBarHeight;
    this.globalData.safeBottomLeft = _e.screenHeight - _e.safeArea.bottom;
  },
  globalData: {},
  config,
  Cloud,
});
