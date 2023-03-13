// release/components/chatbox
const app = getApp();
const {
  MESSAGE_TYPE,
  CHAT_AI_INFO,
  MESSAGE_ERROR_TYPE,
} = require("../../constants.js");

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
          (50 + app.globalData.safeBottomLeft),
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
    //消息记录列表
    chatList: [],
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
    retryRequest(event) {
      var msgindex = event.target.dataset.msgindex;
      // 删除掉再问一次
      this.setData({
        [`chatList[${msgindex}].errorType`]: "",
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
    receiveMsg(_e) {
      console.log("received msg=>", _e);
      if (_e.msgType === MESSAGE_TYPE.CHATAI_ANSWER) {
        let msg = {
          content: _e.data.text,
          errorType: _e.data.errorType,
          msgType: MESSAGE_TYPE.CHATAI_ANSWER,
          userInfo: { nickName: CHAT_AI_INFO.nickName },
        };
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
    jumpToHistory() {
      wx.navigateTo({
        url: '/pages/history/history',
      })
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
  },
});
