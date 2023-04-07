// release/components/chatbox
const app = getApp();
const Config = require("../../config.js");
const {
  MESSAGE_TYPE,
  CHAT_AI_INFO,
  MESSAGE_ERROR_TYPE,
  MAX_TIMEOUT_TIME_VOICE_SPEECH
} = require("../../constants.js");
const MockData = require("../../mock-data");

const cloudContainerCaller = require("../../common/util/cloud-container-call");
const { getVoiceOption } = require("../../common/util/voice-option.js");
const innerAudioContextMap = {}; // 创建内部 audio 上下文 InnerAudioContext 对象。

Component({
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
    },
    detached() {
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    showModalStatus: true
  },
  /**
   * 组件的方法列表
   */
  methods: {
    toggleDrawer() {
      this.setData({ showModalStatus: !this.data.showModalStatus })
    },
    setNickname(e) {
      let nickName = e.detail.value.trim()
      if (nickName.length < 2) {
        wx.showToast({
          title: '至少2个字符',
        })
        return;
      }
      cloudContainerCaller({
        path: "/miniprogram/user/update",
        data: { nickName },
        success: function (_e) {
          console.log("/miniprogram/user/update", _e);
        },
        fail: function (_e) {
          console.log("/miniprogram/user/update error", _e);
        },
      });
    }
  },
});
