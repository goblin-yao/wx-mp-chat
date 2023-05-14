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
      this.setData({
        scrollHeight:
          app.globalData.systemInfo.windowHeight -
          (80 + app.globalData.safeBottomLeft),
      });
      console.log("data in chatbox:", this.data);
    },
    detached() {
      try {
        this.messageWatcher.close();
      } catch (error) {
        console.log("--消息监听器关闭失败--");
      }
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    scrollId: "",
    systemInfo: {},
    MESSAGE_TYPE: MESSAGE_TYPE,
    MESSAGE_ERROR_TYPE: MESSAGE_ERROR_TYPE,
    CHAT_AI_INFO: CHAT_AI_INFO,
    isVoiceFeatureOpen: Config.VoiceToggle,
    //消息记录列表
    chatList: Config.LocalDevMode ? MockData.chatHistory : [],
    //标记触顶事件
    isTop: false,
    //没有更多数据
    noMoreList: false,
  },
  /**
   * 组件的方法列表
   */
  methods: {
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
        display = false
      } else {
        display = true
        // 其他的播放停止，修改状态
        for (let index = 0; index < this.data.chatList.length; index++) {
          const element = this.data.chatList[index];
          if (
            element.voiceDisplaying
          ) {
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
              element && element.stop()
            }
          }
        }
      }
      this.setData({
        [`chatList[${msgindex}].voiceDisplaying`]: display,
      });
      if (!innerAudioContextMap[curMessage.messageId]) {
        wx.showLoading({
          title: 'AI语音合成中',
        })
      }
      await this.textToSpeechFromChatBox(
        display,
        curMessage, {
        endCallBack: () => {
          that.setData({
            [`chatList[${msgindex}].voiceDisplaying`]: false,
          });
        }
      })
    },
    retryRequest(event) {
      var msgindex = event.target.dataset.msgindex;
      // 删除掉再问一次
      this.setData({
        [`chatList[${msgindex}].errorType`]: "",
        [`chatList[${msgindex}].retryRequest`]: true
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
        itemList: ['复制链接地址'],
        success(res) {
          if (res.tapIndex == 0) {
            wx.setClipboardData({
              data: 'https://puzhikeji.com.cn/',
              success(res) {
                console.log(res.data); // data
              },
            });
          }
        },
        fail(res) {
        }
      })
    },
    // 语音合成并自动播放
    async convertTextToVoiceAndPlay(msgToShow) {
      let that = this;
      // 其他的播放停止，修改状态
      for (let index = 0; index < this.data.chatList.length; index++) {
        const element = this.data.chatList[index];
        if (
          element.voiceDisplaying
        ) {
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
            element && element.stop()
          }
        }
      }
      await this.textToSpeechFromChatBox(
        true,
        msgToShow, {
        endCallBack: () => {
          const msgindex = that.data.chatList.findIndex(e => e.messageId == msgToShow.messageId)
          console.log('msgindex=>', msgindex)
          that.setData({
            [`chatList[${msgindex}].voiceDisplaying`]: false,
          });
        }
      })
    },
    getChatListData() {
      return this.data.chatList.slice(-8);//获取最近4条对话
    },
    async receiveMsg(_e) {
      console.log("received msg=>", _e);
      if (_e.msgType === MESSAGE_TYPE.CHATAI_ANSWER) {
        let msg = {
          content: _e.data.text,
          errorType: _e.data.errorType,
          msgType: MESSAGE_TYPE.CHATAI_ANSWER,
          conversationId: _e.data.conversationId,
          parentMessageId: _e.data.parentMessageId,
          messageId: _e.data.id,
          userInfo: { nickName: CHAT_AI_INFO.nickName },
          voiceDisplaying: Config.VoiceToggle ? true : false
        };
        //语音合成
        Config.VoiceToggle && await this.convertTextToVoiceAndPlay(msg);
        msg.totalTime = (new Date().getTime() - app.globalData.AILastRequestStartTime) / 1000
        msg.totalTime = '对话耗时' + msg.totalTime.toFixed(1) + 's';
        //把原来消息的loading删掉
        let newChatList = [];
        for (let index = 0; index < this.data.chatList.length; index++) {
          const element = this.data.chatList[index];
          if (element.msgType != MESSAGE_TYPE.WAITING_CHATAI) {
            newChatList.push(element);
          }
        }
        newChatList.push(msg);
        this.setData({
          chatList: newChatList,
        });
        console.log('textshowed', new Date().toString())
        setTimeout(() => {
          this.setData({
            scrollId: "msg-" + parseInt(newChatList.length - 1),
          });
        }, 100);
      }

      // loading和用户的信息放一起处理，都在页面上展示用
      if (_e.msgType === MESSAGE_TYPE.USER_QUESTION) {
        let msg = {
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
        this.data.chatList.push(msg);

        this.setData({
          chatList: this.data.chatList,
        });
        setTimeout(() => {
          this.setData({
            scrollId: "msg-" + parseInt(this.data.chatList.length - 1),
          });
        }, 100);
      }
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
      console.log('textToSpeechFromChatBox', display, msgInfo)
      //如果是播放
      const curMsgId = msgInfo.messageId
      if (display) {
        if (!innerAudioContextMap[curMsgId]) {
          innerAudioContextMap[curMsgId] = wx.createInnerAudioContext()
          //转换一次语音
          await this.textToAISpeech(msgInfo.content, innerAudioContextMap[curMsgId], callbacks)
        } else {
          innerAudioContextMap[curMsgId].play()
        }
      } else { //暂停
        if (!innerAudioContextMap[curMsgId]) {
          innerAudioContextMap[curMsgId] = wx.createInnerAudioContext()
        } else {
          innerAudioContextMap[curMsgId].pause()
        }
      }
    },
    async textToAISpeech(_text, _nAudioContext, callbacks) {
      if (!_text.trim()) {
        return
      }
      try {
        await this.pluginPromiseToSpeech(_text, _nAudioContext, callbacks);
      } catch {
        callbacks.endCallBack()
        wx.hideLoading()
        wx.showToast({
          title: '语音转换失败，请稍后！',
        })
      }
      wx.hideLoading()
    },
    pluginPromiseToSpeech(_text, _nAudioContext, callbacks) {//超时
      let timeoutP = new Promise((resolve) => {
        setTimeout(() => {
          resolve('timeout');
        }, MAX_TIMEOUT_TIME_VOICE_SPEECH);
      })
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
                console.log('playing', new Date().toString())
              });
              _nAudioContext.onEnded(() => {
                callbacks?.endCallBack && callbacks.endCallBack()
              });
              _nAudioContext.onError((res) => {
                console.log(res.errMsg)
                reject(data)
              });
            }
            console.log('合成结果:', data)
          },
          fail: function (error) {
            reject(error)
            console.log(error);
          }
        })
      })
      return Promise.race([timeoutP, pSpeech])
    },
  },
});
