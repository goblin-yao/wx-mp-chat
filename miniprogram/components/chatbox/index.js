// release/components/chatbox
const app = getApp();
// 配置消息侦听器
var messageWatcher = null;
// 时间工具类
const timeutil = require("./timeutil");
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
      var that = this;
      that.initMessageHistory();
      //初始化监听器
      // that.initWatcher();
      wx.getSystemInfo({
        success: function (res) {
          that.setData({
            systemInfo: res,
          });
        },
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
    //消息记录列表
    chatList: [
      {
        msgType: "text",
        content: "ChatGPT欢迎你",
        userInfo: { nickName: "chatgpt" },
      },
    ],
    //标记触顶事件
    isTop: false,
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //触顶事件
    tapTop() {
      console.log("--触顶--");
      var that = this;
      that.setData(
        {
          isTop: true,
        },
        () => {
          this.getMsgHistory();
        }
      );
    },
    receiveMsg(e) {
      let that = this;
      console.log("received msg", e);
      if (e.fromWhere === "chatgpt") {
        let msg = {
          content: e.data.text,
          msgType: "text",
          userInfo: { nickName: "chatGpt" },
        };
        //把原来消息的loading删掉
        let newChatList = [];
        for (let index = 0; index < this.data.chatList.length; index++) {
          const element = this.data.chatList[index];
          if (element.msgType != "loading") {
            newChatList.push(element);
          }
        }
        newChatList.push(msg);
        this.setData({
          chatList: newChatList,
        });
        setTimeout(function () {
          that.setData({
            scrollId: "msg-" + parseInt(newChatList.length - 1),
          });
        }, 100);
      }
      if (e.fromWhere === "user") {
        let msg = {
          content: "......",
          msgType: "loading",
          userInfo: { nickName: "chatGpt" },
        };
        // 这个loading是给chatgpt的
        let msgForUser = {
          content: e.data.text,
          msgType: "text",
          openid: app.globalData.openid,
          userInfo: app.globalData.userInfo,
        };
        this.data.chatList.push(msgForUser);
        this.data.chatList.push(msg);

        this.setData({
          chatList: this.data.chatList,
        });
        setTimeout(function () {
          that.setData({
            scrollId: "msg-" + parseInt(that.data.chatList.length - 1),
          });
        }, 100);
      }
    },
    //初始化
    initMessageHistory() {
      //初始化消息历史
      var that = this;
      that.setData(
        {
          // chatList: [],
        },
        () => {
          that.reqMsgHis();
        }
      );
    },
    getMsgHistory() {},
    // 请求聊天记录
    reqMsgHis() {
      return;
      var that = this;
      wx.showLoading({
        title: "获取历史记录",
        mask: true,
      });
      wx.cloud.callFunction({
        name: "cloud-msg-his",
        data: {
          step: that.data.chatList.length,
          roomId: that.properties.roomId,
        },
        success: (res) => {
          console.log(res);
          let tarr = res.result.data;
          let newsLen = tarr.length;
          if (newsLen == 0) {
            //查无数据
            setTimeout(function () {
              wx.showToast({
                title: "到顶了",
                icon: "none",
              });
            }, 300);
          }
          tarr = tarr.reverse();
          that.setData(
            {
              chatList: tarr.concat(that.data.chatList),
            },
            () => {
              let len = that.data.chatList.length;
              if (that.data.isTop) {
                setTimeout(function () {
                  that.setData({
                    scrollId: "msg-" + parseInt(newsLen),
                  });
                }, 100);
              } else {
                setTimeout(function () {
                  that.setData({
                    scrollId: "msg-" + parseInt(len - 1),
                  });
                }, 100);
              }
            }
          );
        },
        fail: (res) => {
          console.log(res);
        },
        complete: (res) => {
          wx.hideLoading();
        },
      });
    },
  },
});
