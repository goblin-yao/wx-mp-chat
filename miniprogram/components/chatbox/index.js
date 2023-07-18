// release/components/chatbox
const app = getApp();
const Config = require("../../config.js");
const {
  MESSAGE_TYPE,
  CHAT_AI_INFO,
  MESSAGE_ERROR_TYPE,
  MAX_TIMEOUT_TIME_VOICE_SPEECH,
} = require("../../constants.js");
const MockData = require("../../mock-data");

// 时间工具类
const timeutil = require("../../common/util/timeutil");
const { getVoiceOption } = require("../../common/util/voice-option.js");
const localChatMessagesHandler = require("../../common/util/local-chat-messages-handler");
const innerAudioContextMap = {}; // 创建内部 audio 上下文 InnerAudioContext 对象。

Component({
  /**
   * 组件的初始数据
   */
  data: {
    promptType: -1,
    scenesId: -1,
    scenesText: "",
    promptText: "",
    continueBtnShowFlag: false, //继续上次会话
    showScore: false, //如果是301就要展示打分

    scrollId: "",
    systemInfo: {},
    MESSAGE_TYPE: MESSAGE_TYPE,
    MESSAGE_ERROR_TYPE: MESSAGE_ERROR_TYPE,
    CHAT_AI_INFO: CHAT_AI_INFO,
    isVoiceFeatureOpen: false,
    //消息记录列表
    chatList: Config.LocalDevMode ? MockData.chatHistory : [],
    //标记触顶事件
    isTop: false,
    //没有更多数据
    noMoreList: false,
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
      // setInterval(() => {
      //   const _list = []
      //   for (let index = 0; index < this.data.chatList.length; index++) {
      //     const element = this.data.chatList[index];
      //     element.content += '测。'
      //     _list.push(element)
      //   }
      //   this.setData({ chatList: _list })
      // }, 1000)
      this.setData({
        isVoiceFeatureOpen: app.getVoiceToggle(),
        scrollHeight:
          app.globalData.systemInfo.windowHeight -
          (80 + app.globalData.safeBottomLeft),
      });
      console.log("data in chatbox:", this.data);
    },
    detached() {
      try {
        for (const key in innerAudioContextMap) {
          if (Object.hasOwnProperty.call(innerAudioContextMap, key)) {
            const element = innerAudioContextMap[key];
            element && element.pause();
            // todo 可以更精准暂停当前正在播放中的音频?
          }
        }
      } catch (error) {
        console.log("--释放音频内容失败--");
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    updatePromptInfo(_d) {
      let showScore = _d.scenesId == "301";
      this.setData({
        showScore: showScore,
        promptType: _d.promptType,
        scenesId: _d.scenesId,
        scenesText: _d.scenesText,
        promptText: _d.promptText,
      });
    },
    showScoreModal(_txt) {
      wx.showModal({
        title: 'AI评分',
        content: _txt,
        complete: (res) => {
          if (res.cancel) {

          }

          if (res.confirm) {

          }
        }
      })
    },
    scoreDialogHandler(event) {
      const curMsgId = event.currentTarget.dataset.msgid;
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        if (curMsgId == `msg-${index}`) {
          this.showScoreModal(element.scoreText)
          break;
        }
      }
    },

    scoreHandler(event) {
      const that = this;
      wx.showLoading({
        title: 'AI打分中',
      })
      const curMsgId = event.currentTarget.dataset.msgid;
      let msgIndex = -1
      let tempMsgList = []
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        tempMsgList.push(element)
        if (curMsgId == `msg-${index}`) {
          msgIndex = index;
          // 取这个消息往之前的8条消息
          this.setData({ [`chatList[${index}].showScore`]: 1 })
          break;
        }
      }
      wx.request({
        url: "https://puzhikeji.com.cn/proxyapi/chat",
        data: {
          messages: this.getChatListData(tempMsgList),
          options: { promptText: Config.SCENCES_ALL.kouyu[0]['ScorePromptText'].replace('{{TOPIC}}', decodeURIComponent(this.data.scenesText)) },
        },
        method: "POST",
        header: {
          "content-type": "application/json", // 默认值
        },
        success(_e) {
          console.log("[proxyapi/chat]", _e);
          wx.hideLoading()
          if (_e?.data?.text) {
            that.showScoreModal(_e.data.text)
            that.setData({
              [`chatList[${msgIndex}].showScore`]: 2,
              [`chatList[${msgIndex}].scoreText`]: _e.data.text
            })
          }
        },
        fail(_e) {
          wx.hideLoading()
          that.setData({
            [`chatList[${msgIndex}].showScore`]: -1,
            [`chatList[${msgIndex}].scoreText`]: ''
          })
        },
      });
    },
    copyMsg(event) {
      var curMsgId = event.currentTarget.dataset.msgid;
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        if (curMsgId == `msg-${index}`) {
          wx.setClipboardData({
            data: element.content,
            success(res) {
              console.log(res.data); // data
            },
          });
        }
      }
    },
    async displayVoice(event) {
      let that = this;
      var msgindex = event.target.dataset.msgindex;
      let curMessage = this.data.chatList[msgindex];
      let display = false;
      if (curMessage.voiceDisplaying) {
        display = false;
      } else {
        display = true;
        // 其他的播放停止，修改状态
        for (let index = 0; index < this.data.chatList.length; index++) {
          const element = this.data.chatList[index];
          if (element.voiceDisplaying) {
            this.setData({
              [`chatList[${index}].voiceDisplaying`]: false,
            });
          }
        }
        // 其他播放器停止
        for (const key in innerAudioContextMap) {
          if (Object.hasOwnProperty.call(innerAudioContextMap, key)) {
            if (key !== curMessage.messageId) {
              const element = innerAudioContextMap[key];
              element && element.stop();
            }
          }
        }
      }
      this.setData({
        [`chatList[${msgindex}].voiceDisplaying`]: display,
      });
      if (!innerAudioContextMap[curMessage.messageId]) {
        wx.showLoading({
          title: "AI语音合成中",
        });
      }
      await this.textToSpeechFromChatBox(display, curMessage, {
        endCallBack: () => {
          that.setData({
            [`chatList[${msgindex}].voiceDisplaying`]: false,
          });
        },
      });
    },
    retryRequest(event) {
      var msgindex = event.target.dataset.msgindex;
      // 删除掉再问一次
      this.setData({
        [`chatList[${msgindex}].errorType`]: "",
        [`chatList[${msgindex}].retryRequest`]: true,
      });
      this.triggerEvent("resendMsg");
    },
    cancelRequest(event) {
      var curMsgId = event.target.dataset.msgid;
      // 取消父组件的请求发送，删除页面记录
      app.globalData.curResPromise && app.globalData.curResPromise.abort();
      let newChatList = [];
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        if (
          element.msgType != MESSAGE_TYPE.WAITING_CHATAI &&
          curMsgId !== `msg-${index}`
        ) {
          newChatList.push(element);
        }
      }
      this.setData({
        chatList: newChatList,
      });
    },
    //触顶事件
    tapTop() {
      this.setData(
        {
          isTop: true,
        },
        () => {
          // this.reqMsgHis({ fromTop: true });
        }
      );
    },
    showLink() {
      wx.showActionSheet({
        itemList: ["复制链接地址"],
        success(res) {
          if (res.tapIndex == 0) {
            wx.setClipboardData({
              data: "https://puzhikeji.com.cn/",
              success(res) {
                console.log(res.data); // data
              },
            });
          }
        },
        fail(res) { },
      });
    },
    // 语音合成并自动播放
    async convertTextToVoiceAndPlay(msgToShow) {
      let that = this;
      // 其他的播放停止，修改状态
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        if (element.voiceDisplaying) {
          this.setData({
            [`chatList[${index}].voiceDisplaying`]: false,
          });
        }
      }
      // 其他播放器停止
      for (const key in innerAudioContextMap) {
        if (Object.hasOwnProperty.call(innerAudioContextMap, key)) {
          if (key !== msgToShow.messageId) {
            const element = innerAudioContextMap[key];
            element && element.stop();
          }
        }
      }
      await this.textToSpeechFromChatBox(true, msgToShow, {
        endCallBack: () => {
          const msgindex = that.data.chatList.findIndex(
            (e) => e.messageId == msgToShow.messageId
          );
          console.log("msgindex=>", msgindex);
          that.setData({
            [`chatList[${msgindex}].voiceDisplaying`]: false,
          });
        },
      });
    },

    makeChatListToAI(tempList) {
      const msgList = [];
      for (let index = 0; index < tempList.length; index++) {
        const element = tempList[index];
        if (element?.msgType > 0) {
          msgList.push({
            role: element.msgType == 1 ? "user" : "assistant",
            content: element.content,
          });
        }
      }
      return msgList
    },

    //可以传入特定的消息列表，或者用默认的
    getChatListData(_chatList) {
      const tempList = (_chatList || this.data.chatList).slice(-8); //获取最近4条对话
      return this.makeChatListToAI(tempList)
    },
    updateVoiceToggle(val) {
      this.setData({ isVoiceFeatureOpen: val });
    },
    async receiveMsg(_e) {
      console.log("received msg=>", _e);
      // 有text数据
      if (_e.msgType === MESSAGE_TYPE.CHATAI_ANSWER && _e?.data?.text) {
        let msg = {
          content: _e.data.text,
          errorType: _e.data.errorType,
          msgType: MESSAGE_TYPE.CHATAI_ANSWER,
          conversationId: _e.data.conversationId,
          parentMessageId: _e.data.parentMessageId,
          messageId: _e.data.id,
          userInfo: { nickName: CHAT_AI_INFO.nickName },
          voiceDisplaying: false,
          isDone: !!_e.data.isDone, // 消息是否结束
          isFirstResponse: !!_e.data.isFirstResponse, // 消息是否是第一个消息
          totalTime: 0,
        };
        // 如果消息完成就合成语音
        if (msg.isDone) {
          msg.totalTime =
            (new Date().getTime() - app.globalData.AILastRequestStartTime) /
            1000;
          msg.totalTime = "对话耗时" + msg.totalTime.toFixed(1) + "s";
          //更新指定ID的消息
          for (let index = 0; index < this.data.chatList.length; index++) {
            const element = this.data.chatList[index];
            if (element.messageId === msg.messageId) {
              this.setData({
                [`chatList[${index}].content`]: msg.content,
                [`chatList[${index}].totalTime`]: msg.totalTime,
                [`chatList[${index}].isFirstResponse`]: false,
              });
              this.setMessageDataToLS(msg); // 消息是done后设置到本地
            }
          }
          // 语音合成
          if (this.data.isVoiceFeatureOpen) {
            msg.voiceDisplaying = true; // 消息是否播放
            await this.convertTextToVoiceAndPlay(msg);
          }
        } else {
          let isHaveMessage = false;
          //把原来消息的loading删掉, 如果是新消息就更新，否则就插入一条新的
          // todo 有时候loading消息没删除掉，看看是什么原因
          let newChatList = [];
          for (let index = 0; index < this.data.chatList.length; index++) {
            const element = this.data.chatList[index];
            if (element.msgType != MESSAGE_TYPE.WAITING_CHATAI) {
              newChatList.push(element);
            }
            if (
              element.messageId === msg.messageId &&
              element.msgType === msg.msgType
            ) {
              isHaveMessage = true;
              this.setData({
                [`chatList[${index}].content`]: msg.content,
              });
            }
          }
          //没有新消息才是增加新消息，否则更新
          if (!isHaveMessage) {
            newChatList.push(msg);
            this.setData({
              chatList: newChatList,
            });
          }
          console.log("textshowed", new Date().toString());
          setTimeout(() => {
            this.setData({
              scrollId: "msg-" + parseInt(newChatList.length - 1),
            });
          }, 100);
        }
      }
      // loading和用户的信息放一起处理，都在页面上展示用
      if (_e.msgType === MESSAGE_TYPE.USER_QUESTION) {
        let msgLoading = {
          content: CHAT_AI_INFO.loadingText,
          msgType: MESSAGE_TYPE.WAITING_CHATAI,
          userInfo: { nickName: CHAT_AI_INFO.nickName },
        };
        // 这个loading是给chatai的
        let msgForUser = {
          content: _e.data.text,
          msgType: MESSAGE_TYPE.USER_QUESTION,
          openid: app.globalData.openid,
          userInfo: app.globalData.userInfo,
        };
        // console.log("dddd->", app.globalData.userInfo);
        this.data.chatList.push(msgForUser);
        this.data.chatList.push(msgLoading);

        this.setData({
          chatList: this.data.chatList,
        });

        this.setMessageDataToLS(msgForUser); // 消息是done后设置到本地
        setTimeout(() => {
          this.setData({
            scrollId: "msg-" + parseInt(this.data.chatList.length - 1),
          });
        }, 100);
      }
    },

    showContinueBtn() {
      this.setData({ continueBtnShowFlag: true });
    },
    continueChat() {
      this.setData({ continueBtnShowFlag: false });
      this.setLSDataToChatList();
    },

    uploadUserAva(fileID) {
      return new Promise(function (resolve, reject) {
        wx.cloud.callFunction({
          name: "cloud-user",
          data: {
            avatarUrl: fileID,
            action: "updateUserAvatar",
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
    onChooseAvatar(e) {
      let that = this;
      const { avatarUrl } = e.detail;
      wx.showLoading();
      wx.cloud.uploadFile({
        cloudPath: app.globalData.openid, // 上传至云端的路径
        filePath: avatarUrl, // 小程序临时文件路径
        success: async (res) => {
          console.log(res.fileID); //输出上传后图片的返回地址
          await that.uploadUserAva(res.fileID);
          wx.hideLoading();
          wx.showToast({
            title: "上传成功",
          });
        },
        fail: (res) => {
          wx.hideLoading();
          wx.showToast({
            title: "上传失败",
          });
        },
      });
    },
    async textToSpeechFromChatBox(display, msgInfo, callbacks) {
      console.log("textToSpeechFromChatBox", display, msgInfo);
      //如果是播放
      const curMsgId = msgInfo.messageId;
      if (display) {
        if (!innerAudioContextMap[curMsgId]) {
          innerAudioContextMap[curMsgId] = wx.createInnerAudioContext();
          //转换一次语音
          await this.textToAISpeech(
            msgInfo.content,
            innerAudioContextMap[curMsgId],
            callbacks
          );
        } else {
          innerAudioContextMap[curMsgId].play();
        }
      } else {
        //暂停
        if (!innerAudioContextMap[curMsgId]) {
          innerAudioContextMap[curMsgId] = wx.createInnerAudioContext();
        } else {
          innerAudioContextMap[curMsgId].pause();
        }
      }
    },
    async textToAISpeech(_text, _nAudioContext, callbacks) {
      if (!_text.trim()) {
        return;
      }
      try {
        await this.pluginPromiseToSpeech(_text, _nAudioContext, callbacks);
      } catch {
        wx.hideLoading();
        wx.showToast({
          title: "语音转换失败，请稍后！",
        });
        // {"Response":{"RequestId":"6461058e55ab7434c9b008b0","Error":{"Code":"UnsupportedOperation.TextTooLong","Message":"Text too long"}}}
        callbacks.endCallBack();
      }
      wx.hideLoading();
    },
    pluginPromiseToSpeech(_text, _nAudioContext, callbacks) {
      //超时
      let timeoutP = new Promise((resolve) => {
        setTimeout(() => {
          resolve("timeout");
        }, MAX_TIMEOUT_TIME_VOICE_SPEECH);
      });
      let pSpeech = new Promise((resolve, reject) => {
        app.globalData.txCloudAIVoicePlugin.textToSpeech({
          content: _text,
          ...getVoiceOption(_text),
          success: function (data) {
            let url = data.result.filePath;
            if (url && url.length > 0) {
              _nAudioContext.autoplay = true;
              _nAudioContext.src = url;
              _nAudioContext.play();
              _nAudioContext.onPlay(() => {
                resolve(data);
                console.log("playing", new Date().toString());
              });
              _nAudioContext.onEnded(() => {
                callbacks?.endCallBack && callbacks.endCallBack();
              });
              _nAudioContext.onError((res) => {
                console.log(res.errMsg);
                reject(data);
              });
            }
            console.log("合成结果:", data);
          },
          fail: function (error) {
            reject(error);
            console.log(error);
          },
        });
      });
      return Promise.race([timeoutP, pSpeech]);
    },

    // todo
    setMessageDataToLS(_e) {
      _e.voiceDisplaying = false;
      //保存最近10条对话在本地缓存中
      localChatMessagesHandler.setMsgData(
        { text: this.data.scenesText, scenesId: this.data.scenesId },
        _e
      );
    },

    setLSDataToChatList() {
      const msgFromLS = localChatMessagesHandler.getAllMsgData({
        text: this.data.scenesText,
        scenesId: this.data.scenesId,
      });
      if (msgFromLS?.data?.length) {
        const newChatList = msgFromLS.data.concat(this.data.chatList);
        this.setData({ chatList: newChatList });
      }
    },
  },
});
