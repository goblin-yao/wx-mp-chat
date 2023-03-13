// 获取全局APP
const app = getApp();
const abortPromiseWrapper = require("../../common/util/abort-promise");

const Config = require("../../config");
const cloudContainerCaller = require("../../common/util/cloud-container-call");

const MockData = require("../../mock-data");
const {
  MESSAGE_TYPE,
  MaxInputLength,
  ShareInfo,
  MESSAGE_ERROR_TYPE
} = require("../../constants.js");

// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    curUserInfo: {},
    curOpenId: "",
    //输入框距离
    InputBottom: app.globalData.safeBottomLeft,
    inputContent: "",
    MaxInputLength: MaxInputLength,
    leftChatNum: 0,
    submitBtnDisabled: true,
    inputDisabled: false, //深入框在等待回答时禁止输入
    isLocalDevelopment: false,
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
  async submitQuestion() {
    const userInputQuestion = this.data.inputContent
      .trim()
      .replace(/\s+/g, " ");
    this.setData({
      inputDisabled: true,
      inputContent: "",
    });
    await this.sendMsgToChatAI(userInputQuestion);
    //页面一个loading的交互，chatai等待, 发送消息等待的时候，输入框不能再输入东西了。可以disable掉，有内容返回后再添加

    this.setData({
      inputDisabled: false,
    });
  },
  async onChatRoomEvent(_e) {
    console.log("onChatRoomEvent=>", _e);
    this.selectComponent("#chat_room").receiveMsg(_e);

    //存储问题/答案 数据库
    const res = await cloudContainerCaller({
      path: "/miniprogram/chatmessage/add",
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
    let res = await cloudContainerCaller({
      path: "/miniprogram/checker/text",
      data: { content }
    });
    console.log('res=>', res);
    if (res?.data?.code == 200) {
      result = true;
    } else {
      wx.showToast({
        title: '内容含有敏感词',
      });
    }
    return result;
  },
  handleMsgSuccess(res) {
    let eventData = {
      msgType: MESSAGE_TYPE.CHATAI_ANSWER,
      statusCode: res.statusCode,
    };
    if (res.statusCode === 200) {
      if (res?.data?.base_resp?.ret === 102002) {
        eventData.data = {
          text: "请求超时。",
          errorType: MESSAGE_ERROR_TYPE.TIMEOUT,
        };
      } else if (res?.data?.error?.statusCode === -1) {
        eventData.data = {
          text: "请求超时!",
          errorType: MESSAGE_ERROR_TYPE.TIMEOUT,
        };
      } else if (res?.data?.error?.statusCode === 404) {
        eventData.data = {
          text: "请求超时!!",
          errorType: MESSAGE_ERROR_TYPE.TIMEOUT,
        };
      } else {
        eventData.data = res.data;
      }
    } else {
      eventData.data = {
        text: res?.data?.base_resp ? JSON.stringify(
          res?.data?.base_resp
        ) : "服务器内部错误!",
        errorType: MESSAGE_ERROR_TYPE.SERVER_ERROR,
      };
    }
    this.onChatRoomEvent(eventData); //todo

    this.reduceLimit(); //消耗1次
  },
  resendMsg(event) {
    console.log("ev", event);
    this.sendMsgToChatAI(app.globalData.curUserQuestion);
  },
  async sendMsgToChatAI(userInputQuestion) {
    if (this.data.leftChatNum <= 0) {
      wx.showToast({
        title: "今日使用次数已用完",
      });
      return;
    }
    if (!userInputQuestion) {
      return;
    }
    app.globalData.curUserQuestion = userInputQuestion;
    let checkResult = await this.msgChecker(userInputQuestion);
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
        // res = MockData.chatAITimeout;
        // res = MockData.chatAISuccess;
        res = MockData.chatAIInnerError;
        await this.handleMsgSuccess(res);
      } else {
        const resPromise = new Promise((resolve, reject) => {
          cloudContainerCaller({
            path: "/openai/chat",
            data: { question: userInputQuestion },
            success: function (_e) {
              console.log("/openai/chat", _e);
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
                msgType: MESSAGE_TYPE.CHATAI_ANSWER,
                data: { text: "用户取消" },
              });
            } else {
              this.onChatRoomEvent({
                msgType: MESSAGE_TYPE.CHATAI_ANSWER,
                data: {
                  text: "服务器内部错误。",
                  errorType: MESSAGE_ERROR_TYPE.SERVER_ERROR,
                },
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
    this.userAuth(options);
    console.log("options=>", options);
  },

  userRegister(userInfo) {
    return new Promise(function (resolve, reject) {
      cloudContainerCaller({
        path: "/miniprogram/user/register",
        data: userInfo,
        success: function (_e) {
          console.log("/miniprogram/user/register", _e);
          resolve(_e);
        },
        fail: function (_e) {
          reject(_e);
        },
      });
    });
  },
  setInfo(_tem) {
    app.globalData.openid = _tem.openid;
    app.globalData.userInfo = _tem;
    this.setData({
      curUserInfo: _tem,
      curOpenId: _tem.openid,
      isLocalDevelopment:
        Config.LocalDevMode ||
        Config.ADMIN_OPENID.includes(_tem.openid),
    });
  },
  userAuth(options) {
    const userInfFromStorage = wx.getStorageSync('cur_user_info');
    // 如果本地存储有东西，但不是走的分享，直接走本地环境，有分享就需要重新更新
    if (userInfFromStorage && !options.share_from_openid) {
      console.log('userInfFromStorage=>', userInfFromStorage);
      this.setInfo(userInfFromStorage);
      return;
    }
    let tempUserInfo = { openid: 'ss123456789', avatarUrl: '', nickName: '' };
    cloudContainerCaller({
      path: "/miniprogram/user/auth",
      data: options,
      success: async (res) => {
        console.log("auth=>", res);
        if (res.data.code == -1) {
          console.log("--登录失败--");
        } else {
          console.log("--登录成功--");
        }
        tempUserInfo = res.data.data;

        this.setInfo(tempUserInfo);
        wx.setStorageSync("cur_user_info", tempUserInfo);
      },
      fail: (res) => {
        console.log(res);
        // 获取失败的时候统一使用默认的openid为了让用户能够使用
        this.setInfo(tempUserInfo);
      },
    });
  },
  // 获取用户今天剩余聊天次数
  async getChatLimit() {
    let leftChatNum = 0;
    if (Config.LocalDevMode) {
      this.setData({ leftChatNum: 9999 });
      return;
    }
    try {
      const result = await cloudContainerCaller({
        path: "/miniprogram/limit/get",
      });

      console.log("/miniprogram/limit/get=>", result);
      leftChatNum = result?.data?.chat_left_nums || 0;
    } catch (error) { }

    this.setData({ leftChatNum: leftChatNum });
  },
  // 获取用户今天剩余聊天次数
  async reduceLimit() {
    if (Config.LocalDevMode) {
      return; // 本地开发不减少次数
    }
    this.setData({ leftChatNum: --this.data.leftChatNum });

    const res = await cloudContainerCaller({
      path: "/miniprogram/limit/reduce",
    });
    console.log("/miniprogram/limit/reduce=>", res);
  },
  jumpToAdmin() { },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getChatLimit();
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
      path: `/pages/index/index?share_from_openid=${this.data.curOpenId}&share_flag=${new Date().getTime()}`,
      imageUrl: randomShare.imageUrl,
    };
  },
});
