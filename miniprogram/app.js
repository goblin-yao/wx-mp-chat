//app.js
const Config = require("./config");
App({
  onLaunch() {
    this.InitCloud(); //初始化云服务 / ESC
    this.InitCustom(); //初始化custom所需配置信息
    this.setUserInfo();
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
  setVoiceToggle(val) {
    this.globalData.VoiceToggle = val;
  },
  getVoiceToggle() {
    return this.globalData.VoiceToggle;
  },
  setUserInfo() {
    const userInfFromStorage = wx.getStorageSync("cur_mp_user_info");
    // 如果本地存储有东西，但不是走的分享，直接走本地环境，有分享就需要重新更新
    if (userInfFromStorage) {
      this.globalData.openid = userInfFromStorage.openid;
      this.globalData.userInfo = userInfFromStorage;
    }
  },
  globalData: {
    VoiceToggle: Config.VoiceToggle,
    txCloudAIVoicePluginInited: false,
    txCloudAIVoicePlugin: requirePlugin("QCloudAIVoice"),
    AILastRequestStartTime: 0, //用来展示耗时间
    curResPromise: null, //当前的Promise，用来abort
    messageInterval: null, //当前消息的定时器，abort时取消定时器
    curUserQuestion: "", //用户当前的提问，用来重新发送
  },
});
