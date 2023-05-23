const curAppID = wx.getAccountInfoSync().miniProgram.appId;
//一些常量配置
module.exports = {
  ShareInfo: [
    {
      imageUrl:
        "https://puzhikeji.com.cn/asserts/share_1.jpg",
      title: "提问题-ai来回答",
    },
    {
      imageUrl:
        "https://wxchatnodeexpressazure.azurewebsites.net/images/share_2.jpg",
      title: "据说知道的比爱因斯坦还多！",
    },
    {
      imageUrl:
        "https://wxchatnodeexpressazure.azurewebsites.net/images/share_3.png",
      title: "ai随心聊-天文地理/古今中外",
    },
  ],
  MessageTimer: 1000,//每间隔x毫秒取一次聊天状态
  //可以 wx.getAccountInfoSync().miniProgram.appId 根据当前Appid获取不同的配置
  MaxInputLength: 2000,
  // chatAI的一些配置
  CHAT_AI_INFO: {
    nickName: curAppID === "wxfed2e64d2ff0da4a" ? "声语Pro" : "GeniusAI助手",
    wellcomeTitle:
      curAppID === "wxfed2e64d2ff0da4a"
        ? "欢迎使用声语Pro欢迎。"
        : "欢迎使用GeniusAI助手。",
    loadingText: "。。。。。。",
  },
  GZH_RECEIVE_LIMIT_TEXT:
    curAppID === "wxfed2e64d2ff0da4a" ? "领声语次数" : "领次数", //公众号领次数
  /**
   * 消息类型，约定:大于0的消息是需要入库的消息
   * -1 -> UI的loading等待
   * 1 -> 用户发送的问题
   * 2 -> ChatAI的回答
   */
  MESSAGE_TYPE: { WAITING_CHATAI: -1, USER_QUESTION: 1, CHATAI_ANSWER: 2 },
  MESSAGE_ERROR_TYPE: { TIMEOUT: -1, SERVER_ERROR: -2 },
  MAX_TIMEOUT_TIME_VOICE_SPEECH: 10 * 1000, //语音识别等待10秒
  SUBSCRIBE_TEMPLATE_ID:
    curAppID === "wxfed2e64d2ff0da4a"
      ? "MXaAWjuKPU6WlI3PZt9fof_s7o6U3r25d6CvKhNoA7Q"
      : "Q3SybjHnStxkL5N9PDT-ty59D6Cu_bduGpeLpaJHSkw",
};
