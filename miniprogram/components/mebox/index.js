// release/components/chatbox
const app = getApp();
const gzhIconURL = require("../../asserts/gzh_icon");
const kefuIconURL = require("../../asserts/kefu_icon");
const Config = require("../../config.js");
const {
  MESSAGE_TYPE,
  CHAT_AI_INFO,
  MESSAGE_ERROR_TYPE,
  MAX_TIMEOUT_TIME_VOICE_SPEECH,
  GZH_RECEIVE_LIMIT_TEXT,
} = require("../../constants.js");
const MockData = require("../../mock-data");

const cloudContainerCaller = require("../../common/util/cloud-container-call");
const { getVoiceOption } = require("../../common/util/voice-option.js");
const innerAudioContextMap = {}; // 创建内部 audio 上下文 InnerAudioContext 对象。

Component({
  /**
   * 组件的初始数据
   */
  data: {
    limit_text: GZH_RECEIVE_LIMIT_TEXT,
    gzhIconURL: gzhIconURL,
    kefuIconURL: kefuIconURL,
    userInfo: {},
    showGZH: 0,
    showKeFu: 0,
    showModalStatus: 0,
    leftChatNum: 0,
  },
  /**
   * 组件的一些选项
   */
  options: {
    addGlobalClass: true,
    multipleSlots: true,
  },
  /**
   * 组件注册页面生命周期
   */
  pageLifetimes: {
    show: function () {
      // 页面被展示
    },
  },
  lifetimes: {
    attached() {
      const _userInfo = wx.getStorageSync("cur_user_info");
      console.log("_userInfo", _userInfo);
      if (_userInfo) {
        this.setData({ userInfo: _userInfo });
      }
    },
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    toggleDrawer(e) {
      this.setData({ showModalStatus: !this.data.showModalStatus });
    },
    updateLimit(e) {
      this.setData({ leftChatNum: e.leftChatNum });
    },
    closeGZHDrawer() {
      this.setData({ showModalStatus: true, showGZH: !this.data.showGZH });
    },
    closeKeFuDrawer() {
      this.setData({ showModalStatus: true, showKeFu: !this.data.showKeFu });
    },
    guanzhuEvent() {
      this.setData({ showModalStatus: false, showGZH: !this.data.showGZH });
    },
    kefuEvent() {
      this.setData({ showModalStatus: false, showKeFu: !this.data.showKeFu });
    },
    setNickname(e) {
      let that = this;
      let nickName = e.detail.value.trim();
      if (nickName.length < 2) {
        wx.showToast({
          title: "至少2个字符",
        });
        return;
      }
      if (nickName.length > 6) {
        wx.showToast({
          title: "字符长度不超过6",
        });
        return;
      }
      cloudContainerCaller({
        path: "/miniprogram/user/update",
        data: { nickName },
        success: function (_e) {
          console.log("/miniprogram/user/update", _e);
          wx.setStorageSync("cur_user_info", _e.data.data);
          that.setData({ userInfo: _e.data.data });
        },
        fail: function (_e) {
          console.log("/miniprogram/user/update error", _e);
        },
      });
    },
  },
});
