// 获取全局APP
const app = getApp();
const Cloud = require("../../common/util/cloud-call");
const Config = require("../../config");
const MockData = require("../../mock-data");

// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    login: false,
    //输入框距离
    InputBottom: app.globalData.safeBottomLeft,
    userInfo: {},
    inputContent: "",
    submitBtnDisabled: true,
  },
  InputFocus(e) {
    this.setData({
      InputBottom: e.detail.height,
    });
  },
  InputBlur(e) {
    this.setData({
      InputBottom: app.globalData.safeBottomLeft,
    });
  },
  bindKeyInput(e) {
    this.setData({
      submitBtnDisabled: !e.detail.value.trim(),
    });
    this.data.inputContent = e.detail.value.trim();
  },
  async submit() {
    if (this.data.login) {
      this.sendMsgToChatGPT();
      //页面一个loading的交互，chatgpt等待
    } else {
      let res = await wx.getUserProfile({
        desc: "获取用户聊天头像",
      });
      let userInfo = res.userInfo;

      wx.showLoading({
        title: "获取用户信息",
      });
      let _r = await this.userRegister(userInfo);
      console.log("dddd", _r);
      wx.hideLoading();
      app.globalData.openid = _r.result.openid;
      app.globalData.userInfo = userInfo;
      this.setData({
        userInfo: userInfo,
      });

      //异步配置缓存
      wx.setStorageSync("openid", _r.result.openid);

      this.setData(
        {
          login: true,
        },
        () => {
          this.submit();
        }
      );
    }
  },
  onChatRoomEvent(e) {
    console.log("send msg", e);
    this.selectComponent("#chat_room").receiveMsg(e);
  },
  //在消息校验的时候确定输入框是否清空
  async msgChecker(content) {
    //按钮disable
    this.setData({
      submitBtnDisabled: true,
    });
    let result = false;
    let res = await Cloud.MsgSecCheck(content);
    if (res?.result?.code == 200) {
      result = true;
    } else {
      wx.showToast({
        title: res.result.msg,
      });
    }
    return result;
  },

  async sendMsgToChatGPT() {
    let checkResult = await this.msgChecker(
      this.data.inputContent.replace(/\s/g, "").trim()
    );
    if (!checkResult) {
      return;
    }
    // 先发送一条消息到屏幕上，再等待server的回复
    let eventDataFirst = {
      fromWhere: "user",
      data: { text: this.data.inputContent },
    };
    this.onChatRoomEvent(eventDataFirst);
    try {
      let res = null;
      if (Config.LocalDevMode) {
        // res = MockData.chatGPTTimeout;
        res = MockData.chatGPTSuccess;
      } else {
        res = await wx.cloud.callContainer({
          config: {
            env: "prod-3gqv2g55fbf85d86",
          },
          path: "/api/chat",
          header: {
            "X-WX-SERVICE": "express-wjw3",
            "content-type": "application/json",
          },
          method: "POST",
          data: { question: this.data.inputContent },
        });
      }
      console.log("res=====>", res);
      let eventData = { fromWhere: "chatgpt", statusCode: res.statusCode };
      if (res.statusCode === 200) {
        //清空文本
        this.setData({
          inputContent: "",
        });
        Object.assign(eventData, {
          data: res.data,
        });
      } else {
        Object.assign(eventData, {
          data: { text: JSON.stringify(res?.base_resp || { error: "出错啦" }) },
        });
      }
      this.onChatRoomEvent(eventData);
    } catch (error) {
      console.log("ddd=>", error);
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.userAuth();
  },

  // 目前是getOpenId 2023-2-16
  userRegister(userInfo) {
    return new Promise(function (resolve, reject) {
      wx.cloud.callFunction({
        name: "cloud-user",
        data: {
          userInfo: userInfo,
        },
        success: (res) => {
          resolve(res);
        },
        fail: (res) => {
          reject(res);
        },
      });
    });
  },
  userAuth() {
    //身份校验
    wx.cloud.callFunction({
      name: "auth",
      success: (res) => {
        console.log(res);

        if (res.result.errCode == -1) {
          //
          console.log("--未登录--");
          this.setData({
            login: false,
          });
        } else {
          console.log("--已登录--");
          this.setData({
            login: true,
          });
        }
      },
      fail: (res) => {
        console.log(res);
      },
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () { },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () { },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () { },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () { },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () { },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () { },
});
