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
  MESSAGE_ERROR_TYPE,
  MessageTimer,
  SUBSCRIBE_TEMPLATE_ID,
} = require("../../constants.js");
const recorderManager = wx.getRecorderManager(); // 获取全局唯一的录音管理器 RecorderManager
let speechRecognizerManager = null; //获取全局唯一的语音识别管理器
let txCloudAIVoiceInit = null;
// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    promptType: 1,
    promptText: "",
    showTextEdit: false,
    totalEditContentLength: 0,
    inputEditContent: "",
    inputEditBottom: 50,
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
    isVoiceFeatureOpen: Config.VoiceToggle,
    isVoiceInputStatus: Config.VoiceToggle ? true : false, //语音模式默认为true，否则为false
    voiceTime: Math.floor(Config.maxVoiceTime / 1000), // 初始时间
    voiceStatus: 2, // 语音识别管理器的状态：1为开始，2为停止，
    voiceData: "", //语音识别阶段数据,
    resultNumber: 1, //识别结果的段数
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
  /****限制字数与计算 */
  getValueLength: function (e) {
    let value = e.detail.value;
    let len = parseInt(value.length);
    this.setData({
      totalEditContentLength: len, //当前字数
      inputEditContent: e.detail.value,
    });
  },
  inputEditFocus(e) {
    console.log("[inputEditBottom]", e.detail.height);
    this.setData({
      inputEditBottom: e.detail.height,
    });
  },
  inputEditBlur() {
    this.setData({
      inputEditBottom: 50,
    });
  },
  closeEdit: function () {
    this.setData({ showTextEdit: false });
  },
  async submitEditedQuestion() {
    await this.sendMsgToChatAI({
      userInputQuestion: this.data.inputEditContent.trim(),
    });
    this.setData({ showTextEdit: false, inputContent: "" });
  },
  async submitQuestion() {
    await this.askForSubscribe();
    const userInputQuestion = this.data.inputContent
      .trim()
      .replace(/\s+/g, " ");
    if (userInputQuestion.length > MaxInputLength) {
      wx.showModal({
        title: "输入问题超过长度限制",
        content: `输入问题长度${userInputQuestion.length}，超过${MaxInputLength}字限制。请删减问题字数。`,
        confirmText: "去编辑",
        complete: (res) => {
          if (res.cancel) {
          }
          if (res.confirm) {
            this.setData({
              showTextEdit: true,
              inputEditContent: userInputQuestion,
              totalEditContentLength: userInputQuestion.length,
            });
          }
        },
      });
      return;
    }
    this.setData({
      inputDisabled: true,
      inputContent: "",
    });
    await this.sendMsgToChatAI({ userInputQuestion: userInputQuestion });
    //页面一个loading的交互，chatai等待, 发送消息等待的时候，输入框不能再输入东西了。可以disable掉，有内容返回后再添加

    this.setData({
      inputDisabled: false,
    });
  },
  async onChatRoomEvent(_e, fromSystem) {
    console.log("onChatRoomEvent=>", _e);
    this.selectComponent("#chat_room").receiveMsg(_e);
    if (fromSystem) {
      return;
    }
    if (_e?.data?.isDone || _e.msgType == MESSAGE_TYPE.USER_QUESTION) {
      //存储问题/答案 数据库, e_=done时才保存数据
      //或者用户提出的问题直接保存
      const res = await cloudContainerCaller({
        path: "/miniprogram/chatmessage/add",
        data: _e,
      });

      console.log("cloud-msg-push", res);
    }
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
      data: { content },
    });
    console.log("res=>", res);
    if (res?.data?.code == 200) {
      result = true;
    } else {
      wx.showToast({
        title: "内容含有敏感词",
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
          text: "服务器内部错误!",
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
        text: res?.data?.base_resp
          ? JSON.stringify(res?.data?.base_resp)
          : "服务器内部错误!",
        errorType: MESSAGE_ERROR_TYPE.SERVER_ERROR,
      };
    }
    this.onChatRoomEvent(eventData); //todo

    // 第一次有响应的时候就扣除一次次数
    if (eventData.data.isFirstResponse) {
      this.reduceLimit(); //消耗1次
    }
  },
  resendMsg(event) {
    console.log("ev", event);
    this.sendMsgToChatAI({ userInputQuestion: app.globalData.curUserQuestion });
  },
  getChatListData() {
    const tempList = this.selectComponent("#chat_room").getChatListData();
    const msgList = [];
    for (let index = 0; index < tempList.length; index++) {
      const element = tempList[index];
      if (element?.msgType > 0) {
        msgList.push({
          role: element.openid ? "user" : "assistant",
          content: element.content,
        });
      }
    }
    console.log("[msgList]", msgList);
    return msgList;
  },
  makeMessageToSend(userInpObj) {
    const msgList = [{ role: "user", content: userInpObj.userInputQuestion }];
    return msgList;
  },
  startRequestInterval(messageId) {
    let that = this;
    // 每次轮询把上次的结果删除掉
    clearInterval(app.globalData.messageInterval);
    app.globalData.messageInterval = null;

    app.globalData.messageInterval = setInterval(() => {
      wx.request({
        url: "https://puzhikeji.com.cn/proxyapi/chatstreaminterval",
        data: { messageId },
        method: "POST",
        header: {
          "content-type": "application/json", // 默认值
        },
        success(_e) {
          console.log("[proxyapi/chatstreaminterval]", _e);
          that.handleMsgSuccess(_e);
          if (_e?.data?.isDone) {
            clearInterval(app.globalData.messageInterval);
            app.globalData.messageInterval = null;
          }
        },
        fail(_e) { },
      });
    }, MessageTimer);
  },
  async sendMsgToChatAI(userInputObj) {
    // 如果由系统触发，不做次数等校验
    const { userInputQuestion, fromSystem } = userInputObj;

    let that = this;
    app.globalData.curUserQuestion = userInputQuestion;

    if (!fromSystem) {
      //因为-1000表示是会员
      if (this.data.leftChatNum <= 0 && this.data.leftChatNum > -1000) {
        wx.showToast({
          title: "今日使用次数已用完",
        });
        return;
      }
      if (!userInputQuestion) {
        return;
      }
      let checkResult = await this.msgChecker(userInputQuestion);
      if (!checkResult) {
        return;
      }
      console.log(
        "[AILastRequestStartTime]",
        app.globalData.AILastRequestStartTime
      );
      if (
        new Date().getTime() - app.globalData.AILastRequestStartTime <
        10 * 1000
      ) {
        wx.showToast({
          title: "提问太频繁了，过几秒钟再试试",
        });
        return;
      }
    }

    app.globalData.AILastRequestStartTime = +new Date();
    // 先发送一条消息到屏幕上，再等待server的回复
    let eventDataFirst = {
      msgType: MESSAGE_TYPE.USER_QUESTION,
      data: { text: userInputQuestion },
    };
    try {
      await this.onChatRoomEvent(eventDataFirst, fromSystem); //todo

      let res = null;
      if (Config.LocalDevMode) {
        // res = MockData.chatAITimeout;
        // res = MockData.chatAISuccess;
        res = MockData.chatAIInnerError;
        await this.handleMsgSuccess(res);
      } else {
        // no stream
        const resPromise = new Promise((resolve, reject) => {
          wx.request({
            url: "https://puzhikeji.com.cn/proxyapi/chatstreamstart",
            data: {
              messages: this.getChatListData(),
              options: { promptText: this.data.promptText },
            },
            method: "POST",
            header: {
              "content-type": "application/json", // 默认值
            },
            success(_e) {
              console.log("[proxyapi/chat]", _e);
              _e?.data?.id && that.startRequestInterval(_e?.data?.id); //通过消息ID轮询
              resolve(_e);
            },
            fail(_e) {
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
  //切换到文本输入
  changeToTextInput() {
    //停止输入语音
    this.stopVoice();
    this.setData({
      isVoiceInputStatus: false,
    });
  },
  //切换到语音输入状态
  changeToVoiceInput() {
    this.setData({
      isVoiceInputStatus: true,
    });
  },
  /**开始录音并识别 */
  startVoice: function () {
    if (this.data.leftChatNum <= 0) {
      wx.showToast({
        title: "今日使用次数已用完",
      });
      return;
    }
    // 需要开始识别时调用此方法
    const params = {
      signCallback: null, // 鉴权函数
      // 用户参数
      secretkey: Config.txCloudInfo.secretkey,
      secretid: Config.txCloudInfo.secretid,
      appid: Config.txCloudInfo.appid,
      // 录音参数
      duration: Config.maxVoiceTime, // 最长一分钟
      frameSize: 0.32, //单位:k

      // 实时识别接口参数
      engine_model_type: "16k_zh",
      // 以下为非必填参数，可跟据业务自行修改
      // hotword_id : '08003a00000000000000000000000000',
      // needvad: 0,
      // filter_dirty: 1,
      // filter_modal: 2,
      // filter_punc: 0,
      // convert_num_mode : 1,
      // word_info: 2,
      // vad_silence_time: 200,
      // token: ''  // 若密钥为临时密钥，需传此参数
    };
    speechRecognizerManager.start(params);
    clearInterval(txCloudAIVoiceInit); // 取消之前的计时
    this.setData({
      voiceStatus: 1,
    });
    this.timeCounter(); // 开始计时
  },
  /**
   * 停止识别
   */
  stopVoice: function () {
    speechRecognizerManager.stop();
    this.timeCounter(true);
  },
  timeCounter: function (time) {
    // 定义一个计时器函数
    var that = this;
    if (time == undefined) {
      txCloudAIVoiceInit = setInterval(function () {
        // 设定一个计时器ID。按照指定的周期（以毫秒计）来执行注册的回调函数
        var voiceTime = that.data.voiceTime - 1; // 每秒钟计时+1
        if (voiceTime > 0) {
          that.setData({
            voiceTime: voiceTime,
          });
        } else {
          clearInterval(txCloudAIVoiceInit); // 取消计时
          that.setData({
            voiceTime: voiceTime,
            voiceStatus: 2,
          });
        }
      }, 1000);
    } else {
      clearInterval(txCloudAIVoiceInit); // 取消计时
      that.setData({
        voiceTime: Math.floor(Config.maxVoiceTime / 1000),
        voiceStatus: 2,
      });
      console.log("暂停计时");
    }
  },
  initAIVoice() {
    if (app.globalData.txCloudAIVoicePluginInited) {
      return;
    }
    app.globalData.txCloudAIVoicePluginInited = true;
    app.globalData.txCloudAIVoicePlugin.setQCloudSecret(
      Config.txCloudInfo.appid,
      Config.txCloudInfo.secretid,
      Config.txCloudInfo.secretkey,
      true
    );
    speechRecognizerManager =
      app.globalData.txCloudAIVoicePlugin.speechRecognizerManager();
    // 请在页面onLoad时初始化好下列函数并确保腾讯云账号信息已经设置
    speechRecognizerManager.OnRecognitionStart = (res) => {
      console.log("开始识别", res);
    };
    // 一句话开始
    speechRecognizerManager.OnSentenceBegin = (res) => {
      console.log("一句话开始", res);
    };
    // 识别变化时
    speechRecognizerManager.OnRecognitionResultChange = (res) => {
      console.log("识别变化时", res);
    };
    // 一句话结束
    speechRecognizerManager.OnSentenceEnd = async (res) => {
      console.log("一句话结束", res);
      try {
        const voiceQuestion = res.result.voice_text_str.trim();
        if (!voiceQuestion && this.data.isVoiceInputStatus) {
          wx.showToast({
            title: `语音输入为空`,
          });
        } else {
          wx.showLoading({
            title: "语音识别中",
          });
          await this.sendMsgToChatAI({ userInputQuestion: voiceQuestion });
          wx.hideLoading();
        }
      } catch (error) {
        wx.showModal({
          title: "异常",
          content: `语音识别异常${JSON.stringify(error)}`,
          complete: (res) => {
            if (res.cancel) {
            }
            if (res.confirm) {
            }
          },
        });
      }
    };
    // 识别结束
    speechRecognizerManager.OnRecognitionComplete = (res) => {
      console.log("识别结束", res);
    };
    // 识别错误
    speechRecognizerManager.OnError = (res) => {
      console.log("识别失败", res);
      wx.showModal({
        title: "识别失败",
        content: JSON.stringify(res),
        complete: (res) => {
          if (res.cancel) {
          }

          if (res.confirm) {
          }
        },
      });
    };
    // 录音结束（最长10分钟）时回调
    speechRecognizerManager.OnRecorderStop = (res) => {
      console.log("录音结束", res);
    };
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("page load options=>", options);
    wx.setNavigationBarTitle({
      title: decodeURIComponent(options.text || "声语Pro"),
    });
    this.selectComponent("#chat_room").updatePromptInfo({
      promptType: options.promptType,
      promptText: "",
    });
    // 你现在是一名雅思外教，对我进行英文雅思对话练习，由你开始说话，你和我轮流每人说一句，请开始
    this.setData({ promptType: options.promptType });

    this.startConversation(options);

    // 由于之前页面已经注册了用户，所以这里不注册用户
    // this.userAuth(options);
    Config.VoiceToggle && this.initAIVoice();
  },
  startConversation(_params) {
    const { scenesId } = _params;

    let promptText = "";
    let startTalkForUser = ''
    for (let iterator in Config.SCENCES_ALL) {
      const curArray = Config.SCENCES_ALL[iterator];
      for (let j = 0; j < curArray.length; j++) {
        if (String(scenesId) === String(curArray[j]["scenesId"])) {
          console.log(curArray[j]);
          promptText = curArray[j]["promptInfo"]["promptText"];
          startTalkForUser = curArray[j]["promptInfo"]["startTalk"];
        }
      }
    }
    this.data.promptText = promptText;

    // 雅思教练两种场景，需要自动聊天，其他的情况等待进入页面由用户触发
    if (!["102", "103", "201", '202'].includes(String(scenesId))) {
      return;
    }
    this.sendMsgToChatAI({
      userInputQuestion: startTalkForUser,
      fromSystem: true,
    }); //todo
  },

  setInfo(_tem) {
    app.globalData.openid = _tem.openid;
    app.globalData.userInfo = _tem;
    this.setData({
      curUserInfo: _tem,
      curOpenId: _tem.openid,
      isLocalDevelopment:
        Config.LocalDevMode || Config.ADMIN_OPENID.includes(_tem.openid),
    });
  },
  userAuth(options) {
    const userInfFromStorage = wx.getStorageSync("cur_mp_user_info");
    // 如果本地存储有东西，但不是走的分享，直接走本地环境，有分享就需要重新更新
    if (userInfFromStorage && !options.share_from_openid) {
      console.log("userInfFromStorage=>", userInfFromStorage);
      this.setInfo(userInfFromStorage);
      return;
    }
    let tempUserInfo = { openid: "ss123456789", avatarUrl: "", nickName: "" };
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
        wx.setStorageSync("cur_mp_user_info", tempUserInfo);
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
      this.selectComponent("#me_dialog").updateLimit({ leftChatNum: 9999 });
      return;
    }
    try {
      const result = await cloudContainerCaller({
        path: "/miniprogram/limit/get",
      });

      console.log("/miniprogram/limit/get=>", result);
      leftChatNum = result?.data?.data?.chatLeftNums || 0;
    } catch (error) {
      console.log("miniprogram/limit/get error", error);
    }

    this.setData({ leftChatNum: leftChatNum });
    this.selectComponent("#me_dialog").updateLimit({ leftChatNum });
  },
  // 获取用户今天剩余聊天次数
  async reduceLimit() {
    if (Config.LocalDevMode) {
      return; // 本地开发不减少次数
    }
    const leftChatNum = --this.data.leftChatNum;
    this.setData({ leftChatNum });
    // 通知me_dialog
    this.selectComponent("#me_dialog").updateLimit({ leftChatNum });

    const res = await cloudContainerCaller({
      path: "/miniprogram/limit/reduce",
    });
    console.log("/miniprogram/limit/reduce=>", res);
  },
  //订阅
  async askForSubscribe() {
    const flag = wx.getStorageSync("subscribe_show");
    if (flag) {
      //如果有且小于7天
      if (flag - new Date().getTime() < 7 * 24 * 3600 * 1000) {
        return new Promise((_r) => {
          _r();
        });
      }
    }
    const res = await wx.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TEMPLATE_ID],
    });
    wx.setStorageSync("subscribe_show", new Date().getTime());
    // if (res[SUBSCRIBE_TEMPLATE_ID] === "reject") {
    //   wx.setStorageSync("subscribe_show", new Date().getTime());
    // }
    console.log("订阅消息返回内容", res);
  },
  //订阅
  // async testForSubscribe() {
  //   const res = await cloudContainerCaller({
  //     path: "/miniprogram//subscribe/test",
  //   });
  //   console.log("发送订阅消息返回内容", res);
  // },
  jumpToAdmin() { },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },

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

  jumpToHistory() {
    wx.navigateTo({
      url: "/pages/history/history",
    });
  },

  openMeBox() {
    this.selectComponent("#me_dialog").toggleDrawer();
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const randomShare = ShareInfo[Math.floor(Math.random() * ShareInfo.length)];
    return {
      title: randomShare.title,
      path: `/pages/index/index?share_from_openid=${this.data.curOpenId
        }&share_timestamp=${new Date().getTime()}`,
      imageUrl: randomShare.imageUrl,
    };
  },
});
