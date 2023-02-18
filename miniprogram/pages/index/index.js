// 获取全局APP
const app = getApp();
// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    login: false,
    //输入框距离
    InputBottom: 0,
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
      InputBottom: 0,
    });
  },
  bindKeyInput(e) {
    this.setData({
      submitBtnDisabled: !e.detail.value.trim(),
    });
    this.data.inputContent = e.detail.value.trim();
    console.log("ddd=>", e.detail.value);
  },
  async submit() {
    if (this.data.login) {
      this.sendMsgToChatGPT();
      //页面一个loading的交互，chatgpt等待
    } else {
      let res = await wx.getUserProfile({
        desc: "获取用户聊天头像",
        // success: (res) => {},
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
  async sendMsgToChatGPT() {
    // 先发送一条消息到屏幕上，再等待server的回复
    let eventDataFirst = {
      fromWhere: "user",
      data: { text: this.data.inputContent },
    };
    this.onChatRoomEvent(eventDataFirst);
    //按钮disable
    this.setData({
      submitBtnDisabled: true,
    });
    try {
      let res = await wx.cloud.callContainer({
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

      //调试内容
      // 返回数据-mock
      // let res = {
      //   data: {
      //     role: "assistant",
      //     id: "cmpl-6kWYwkLeDv8LfLXcBNzXNPNdDucCH",
      //     parentMessageId: "e2fb72a5-d2a8-410a-8dda-013b2e52dea2",
      //     conversationId: "6d83626c-726f-4ae2-9a0d-c6ed2bdcc7d9",
      //     text: "2",
      //     detail: {
      //       id: "cmpl-6kWYwkLeDv8LfLXcBNzXNPNdDucCH",
      //       object: "text_completion",
      //       created: 1676546278,
      //       model: "text-davinci-003",
      //       choices: [
      //         {
      //           text: "\n2",
      //           index: 0,
      //           logprobs: null,
      //           finish_reason: "stop",
      //         },
      //       ],
      //       usage: {
      //         prompt_tokens: 61,
      //         completion_tokens: 2,
      //         total_tokens: 63,
      //       },
      //     },
      //   },
      //   header: {
      //     "Access-Control-Allow-Origin": "*",
      //     "Access-Control-Allow-Credentials": "true",
      //     "X-CloudBase-Request-Id": "4c65e376c131417a986af7af4ba31c53",
      //     server: "nginx/1.17.8",
      //     date: "Thu, 16 Feb 2023 11:17:59 GMT",
      //     "content-type": "application/json; charset=utf-8",
      //     vary: "Accept-Encoding",
      //     "x-powered-by": "Express",
      //     etag: 'W/"1cb-ofKrb2sDJOBgrtgVmc5AzcyaVJA"',
      //     "x-cloudbase-upstream-status-code": "200",
      //     "X-CloudBase-Upstream-TimeCost": "1281",
      //     "x-wx-call-id": "0.7320950346479209_1676546277869",
      //     "x-wx-server-timing": "1676546278077,1676546279470",
      //     "Access-Control-Expose-Headers": "x-wx-call-id, x-wx-server-timing",
      //     Connection: "keep-alive",
      //     "Content-Encoding": "gzip",
      //     "Content-Length": "314",
      //   },
      //   statusCode: 200,
      //   cookies: [],
      //   errMsg: "request:ok",
      // };

      console.log("res=====>", res);
      let eventData = { fromWhere: "chatgpt", statusCode: res.statusCode };
      if (res.statusCode === 200) {
        Object.assign(eventData, {
          data: res.data,
        });
      } else {
        Object.assign(eventData, {
          data: { text: JSON.stringify(res.data) },
        });
      }
      this.onChatRoomEvent(eventData);
    } catch (error) {
      console.log("ddd=>", error);
    }
    //按钮disable
    this.setData({
      submitBtnDisabled: false,
    });
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
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},
});
