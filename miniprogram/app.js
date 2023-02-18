//app.js
const config = require("config");
const Cloud = require("common/util/cloud-call");
App({
  onLaunch: function () {
    this.InitCloud(); //初始化云服务 / ESC
    this.InitCustom(); //初始化custom所需配置信息
  },
  InitCloud() {
    var that = this;
    wx.cloud.init({
      env: config.CloudID,
      traceUser: true,
    });
  },
  InitCustom() {
    let e = wx.getSystemInfoSync()

    console.log('getSystemInfoSync=>', e)
    this.globalData.StatusBar = e.statusBarHeight;
    let custom = wx.getMenuButtonBoundingClientRect();
    // console.log(custom)
    this.globalData.Custom = custom;
    this.globalData.CustomBar =
      custom.bottom + custom.top - e.statusBarHeight;
    this.globalData.safeBottomLeft = e.screenHeight - e.safeArea.bottom;
  },
  globalData: {},
  config,
  Cloud,
});
