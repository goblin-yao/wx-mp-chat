// 获取全局APP
const app = getApp();
const cloudContainerCaller = require("../../common/util/cloud-container-call");
const Config = require("../../config");
const { ShareInfo } = require("../../constants.js");
const topics = require('./topics')
// 获取计时器函数
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // prompt类型待再后台配置，当前先用这样的类型
    topics: []
  },
  updateTopics() {
    this.makeTopics()
  },
  makeTopics(count = 3) {
    // 克隆原始数组以防止修改
    const clonedArray = [...topics];

    // 新建一个空数组用于存储随机选取的元素
    const result = [];

    // 随机选取元素直到达到指定的数量
    while (result.length < count) {
      // 生成一个随机索引
      const randomIndex = Math.floor(Math.random() * clonedArray.length);

      // 从原始数组中取出对应的元素，并将其添加到结果数组中
      const randomElement = clonedArray.splice(randomIndex, 1)[0];
      result.push(randomElement);
    }
    this.setData({ topics: result });
  },
  jumpPage(e) {

    const data = e.currentTarget.dataset;
    const topic = this.data.topics[data.index]
    const pageInfo = Config.SCENCES_ALL.kouyu[0];
    const url = pageInfo.pagePath;
    // 更新prompt
    pageInfo.promptInfo.promptText = pageInfo.promptInfo.promptText.replace('{{TOPIC}}', topic)
    // 更新startTalk
    pageInfo.promptInfo.startTalk = pageInfo.promptInfo.startTalk.replace('{{TOPIC}}', topic)
    wx.navigateTo({
      url: `${url}?text=${topic}&promptType=${pageInfo.promptInfo.promptType}&scenesId=${pageInfo.scenesId}`,
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
  setInfo(_tem) {
    app.globalData.openid = _tem.openid;
    app.globalData.userInfo = _tem;
    this.setData({
      curUserInfo: _tem,
      curOpenId: _tem.openid,
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("page load options=>", options);
    this.makeTopics();
    this.userAuth(options);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar((tabBar) => {
        tabBar.setData({
          selected: 2
        })
      })
    }
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
