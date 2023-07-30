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
  saveSelectData(_info) {
    wx.setStorageSync('last_select_duihua_topics', _info)
  },
  getTopicInitData() {
    const d = wx.getStorageSync('last_select_duihua_topics')
    if (d?.topic) {
      d.topic.clicked = true
      return [d.topic];
    }
    return [];
  },
  setTopicStatus(_info) {
    const _t = this.data.topics
    const newArray = []
    for (let index = 0; index < _t.length; index++) {
      const element = _t[index];
      if (element.content == _info.topic.content) {
        element.clicked = true
      } else {
        element.clicked = false
      }
      newArray.push(element)
    }
    this.setData({
      topics: newArray
    })
  },
  updateTopics() {
    this.makeTopics() // TBD ,是否永远将第一条置顶，否则传入true
  },
  makeTopics(refresh = false) {
    // 克隆原始数组以防止修改
    const clonedArray = [...topics];
    // 新建一个空数组用于存储随机选取的元素
    // 第一个元素从历史记录中取，第二次刷新后删除掉历史记录
    const result = refresh ? [] : this.getTopicInitData();
    // 随机选取元素直到达到指定的数量
    while (result.length < 10) {
      // 生成一个随机索引
      const randomIndex = Math.floor(Math.random() * clonedArray.length);

      // 从原始数组中取出对应的元素，并将其添加到结果数组中
      const randomElement = clonedArray.splice(randomIndex, 1)[0];
      !result.find(e => e.content == randomElement) && result.push({ content: randomElement });
    }
    this.setData({ topics: result });
  },
  showSelection(e) {
    const that = this
    const data = e.currentTarget.dataset;
    const topic = this.data.topics[data.index]
    if (topic.clicked) {
      //从数据缓存中取，然后直接跳转，不用回显了
      const d = wx.getStorageSync('last_select_duihua_topics')
      that.jumpPage(d.pageInfoType, d.topic)
      return;
    }

    wx.showActionSheet({
      itemList: ["AI发起对话模式", "AI相互对话模式"],
      success(res) {
        if (res.tapIndex == 0) {
          that.jumpPage(0, topic)
        }
        if (res.tapIndex == 1) {
          that.jumpPage(1, topic)
        }
      },
      fail(res) { },
    });
  },
  jumpPage(pageInfoType, topic) {
    const pageInfo = Config.SCENCES_ALL.duihua[pageInfoType];
    const url = pageInfo.pagePath;
    // 更新prompt
    pageInfo.promptInfo.promptText = pageInfo.promptInfo.promptTextTemplate.replace('{{TOPIC}}', topic.content)
    // 更新startTalk
    pageInfo.promptInfo.startTalkText = pageInfo.promptInfo.startTalkTemplate.replace('{{TOPIC}}', topic.content)
    this.saveSelectData({ pageInfoType, topic });
    this.setTopicStatus({ pageInfoType, topic });//根据状态更新对应的topic选择样式

    const toUrl = `${url}?scenesText=${encodeURIComponent(topic.content)}&promptType=${pageInfo.promptInfo.promptType}&scenesId=${pageInfo.scenesId}`
    console.log(toUrl);
    wx.navigateTo({
      url: toUrl
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
          selected: 1
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
