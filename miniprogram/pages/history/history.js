const app = getApp();
const {
  MESSAGE_TYPE,
  CHAT_AI_INFO,
  MESSAGE_ERROR_TYPE,
} = require("../../constants.js");

const cloudContainerCaller = require("../../common/util/cloud-container-call");

// 时间工具类
const timeutil = require("../../utils/timeutil");

// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    MESSAGE_TYPE: MESSAGE_TYPE,
    MESSAGE_ERROR_TYPE: MESSAGE_ERROR_TYPE,
    CHAT_AI_INFO: CHAT_AI_INFO,
    isTop: false,
    scrollId: '',
    //消息记录列表
    chatList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.initMessageHistory()
    wx.hideShareMenu()
  },
  //初始化
  async initMessageHistory() {
    //如果没有userinfo先查询一次
    try {
      if (!app.globalData.userInfo) {
        const res = await cloudContainerCaller({
          path: "/miniprogram/user/auth",
        });

        if (res.data.code == 200) {
          app.globalData.openid = res.data.data.openid;
          app.globalData.userInfo = res.data.data;
        } else {
        }
      }
    } catch (error) { }
    this.reqMsgHis();
  },
  // 请求聊天记录
  reqMsgHis(option) {
    if (this.data.noMoreList) {
      return;
    }
    cloudContainerCaller({
      path: "/miniprogram//chatmessage/history",
      data: {
        step: this.data.chatList.length,
        option,
      },
      success: (result) => {
        console.log("cloud-msg-his", result);
        let tarr = result.data.data.rows;
        let newsLen = tarr.length;
        if (newsLen == 0) {
          this.data.noMoreList = true;
          return;
        }
        tarr = tarr.reverse();

        let len = this.data.chatList.length + newsLen;
        //给每个用户的信息加上userinfo
        for (let index = 0; index < tarr.length; index++) {
          if (tarr[index]["msgType"] === MESSAGE_TYPE.USER_QUESTION) {
            tarr[index]["userInfo"] = app.globalData.userInfo;

            tarr[index]["timeString"] = timeutil.TimeCode(tarr[index]['createdAt']);
          }
        }
        this.setData(
          {
            chatList: tarr.concat(this.data.chatList),
            scrollId: this.data.isTop
              ? "msg-" + parseInt(newsLen)
              : "msg-" + parseInt(len - 1),
          },
          () => { }
        );
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
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
});
