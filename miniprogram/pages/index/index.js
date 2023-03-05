// 获取全局APP
const app = getApp();
const Cloud = require("../../common/util/cloud-call");
const abortPromiseWrapper = require("../../common/util/abort-promise");

const Config = require("../../config");

const MockData = require("../../mock-data");
const { MESSAGE_TYPE, MaxInputLength, ShareInfo, MESSAGE_ERROR_TYPE, ADMIN_OPENID } = require("../../constants.js");

// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    login: false,
    curUserInfo: {},
    curOpenId: '',
    //输入框距离
    InputBottom: app.globalData.safeBottomLeft,
    inputContent: "",
    MaxInputLength: MaxInputLength,
    leftChatNum: 0,
    submitBtnDisabled: true,
    inputDisabled: false, //深入框在等待回答时禁止输入
    isLocalDevelopment: false
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
      const userInputQuestion = this.data.inputContent.trim().replace(/\s+/g, " ")
      this.setData({
        inputDisabled: true,
        inputContent: "",
      });
      await this.sendMsgToChatGPT(userInputQuestion);
      //页面一个loading的交互，chatgpt等待, 发送消息等待的时候，输入框不能再输入东西了。可以disable掉，有内容返回后再添加

      this.setData({
        inputDisabled: false,
      });
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
        curUserInfo: userInfo,
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
  async onChatRoomEvent(_e) {
    console.log("onChatRoomEvent=>", _e);
    this.selectComponent("#chat_room").receiveMsg(_e);

    //存储问题/答案 数据库
    const res = await wx.cloud.callFunction({
      name: "cloud-msg-push",
      data: _e,
    });

    console.log("cloud-msg-push", res);
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
  handleMsgSuccess(res) {
    let eventData = {
      msgType: MESSAGE_TYPE.CHATGPT_ANSWER,
      statusCode: res.statusCode,
    };
    if (res.statusCode === 200) {
      if (res?.data?.base_resp?.ret === 102002) {
        eventData.data = { text: "请求超时。", errorType: MESSAGE_ERROR_TYPE.TIMEOUT };
      } else if (res?.data?.error?.statusCode === -1) {
        eventData.data = { text: "请求超时!", errorType: MESSAGE_ERROR_TYPE.TIMEOUT };
      } else if (res?.data?.error?.statusCode === 404) {
        eventData.data = { text: "请求超时!!", errorType: MESSAGE_ERROR_TYPE.TIMEOUT };
      } else {
        eventData.data = res.data;
      }
    } else {
      eventData.data = {
        text: JSON.stringify(res?.data?.base_resp || { error: "服务器内部错误!" }),
        errorType: MESSAGE_ERROR_TYPE.SERVER_ERROR
      };
    }
    this.onChatRoomEvent(eventData); //todo

    this.reduceLimit(); //消耗1次
  },
  resendMsg(event) {
    console.log('ev', event)
    this.sendMsgToChatGPT(app.globalData.curUserQuestion)
  },
  async sendMsgToChatGPT(userInputQuestion) {
    if (this.data.leftChatNum <= 0) {
      wx.showToast({
        title: '今日使用次数已用完',
      })
      return
    }
    if (!userInputQuestion) {
      return
    }
    app.globalData.curUserQuestion = userInputQuestion
    let checkResult = await this.msgChecker(
      userInputQuestion
    );
    if (!checkResult) {
      return;
    }

    // 先发送一条消息到屏幕上，再等待server的回复
    let eventDataFirst = {
      msgType: MESSAGE_TYPE.USER_QUESTION,
      data: { text: userInputQuestion },
    };
    try {
      await this.onChatRoomEvent(eventDataFirst); //todo
      let res = null;
      if (Config.LocalDevMode) {
        // res = MockData.chatGPTTimeout;
        // res = MockData.chatGPTSuccess;
        res = MockData.chatGPTInnerError
        await this.handleMsgSuccess(res);
      } else {
        const resPromise = new Promise((resolve, reject) => {
          wx.cloud.callContainer({
            config: {
              env: Config.CloudInfo.ServerEnv,
            },
            path: "/api/chat",
            header: {
              "X-WX-SERVICE": Config.CloudInfo.SericeName,
              "content-type": "application/json",
            },
            timeout: 30000,
            method: "POST",
            data: { question: userInputQuestion },
            success: function (_e) {
              console.log("/api/chat", _e);
              resolve(_e);
            },
            fail: function (_e) {
              reject(_e);
            },
          });
        });
        const newResPromise = abortPromiseWrapper(resPromise);
        newResPromise
          .then(async (_res) => {
            await this.handleMsgSuccess(_res);
          })
          .catch((error) => {
            console.log("ddd=>", error);
            if (error && error.type === "user_abort") {
              this.onChatRoomEvent({
                msgType: MESSAGE_TYPE.CHATGPT_ANSWER,
                data: { text: "用户取消" },
              });
            } else {
              this.onChatRoomEvent({
                msgType: MESSAGE_TYPE.CHATGPT_ANSWER,
                data: { text: "服务器内部错误。" },
              });
            }
          });
        app.globalData.curResPromise = newResPromise; //当前有promise
      }
    } catch (error) { }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showModal({
      title: '调试中',
      content: '调试中，遇到偶尔会有错误',
      complete: (res) => {
        if (res.cancel) {

        }

        if (res.confirm) {

        }
      }
    })
    this.userAuth();
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
        console.log("auth=>", res);
        if (res.result.errCode == -1) {
          console.log("--未登录--");
          this.setData({
            login: false,
          });
        } else {
          console.log("--已登录--");
          app.globalData.openid = res.result.result.openid;
          app.globalData.userInfo = res.result.result.userInfo;
          this.setData({
            curUserInfo: app.globalData.userInfo,
            curOpenId: app.globalData.openid,
            login: true,
            isLocalDevelopment: Config.LocalDevMode || ADMIN_OPENID.includes(app.globalData.openid)
          });
        }
      },
      fail: (res) => {
        console.log(res);
      },
    });
  },
  // 获取用户今天剩余聊天次数
  async getChatLimit() {
    let leftChatNum = 0;
    if (Config.LocalDevMode) {
      this.setData({ leftChatNum: 9999 })
      return;
    }
    try {

      const result = await wx.cloud.callFunction({
        name: "cloud-user-limit",
        data: {
          action: "getLimit",
        },
      });
      console.log('getChatLimit=>', result)
      if (result?.result?.stats?.created) {
        leftChatNum = 5
      } else {
        leftChatNum = result?.result?.data?.chat_left_nums || 0
      }
    } catch (error) {

    }
    this.setData({ leftChatNum: leftChatNum })
  },
  // 获取用户今天剩余聊天次数
  async reduceLimit() {
    if (Config.LocalDevMode) {
      return;// 本地开发不减少次数
    }
    this.setData({ leftChatNum: --this.data.leftChatNum })
    const res = await wx.cloud.callFunction({
      name: "cloud-user-limit",
      data: {
        action: "reduceLimit",
      },
    });
    console.log('reduceLimit=>', res)
  },
  jumpToAdmin() {

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // wx.showToast({
    //   title: 'onReady',
    // })
    // this.getChatLimit()
    // this.reduceLimit()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getChatLimit()
  },

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
  onShareAppMessage: function () {
    const randomShare = ShareInfo[Math.floor(Math.random() * ShareInfo.length)];
    return {
      title: randomShare.title,
      path: `/pages/index/index`,
      imageUrl: randomShare.imageUrl
    }
  },
});
