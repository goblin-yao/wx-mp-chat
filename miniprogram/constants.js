//一些常量配置
module.exports = {
  ShareInfo: [{
    imageUrl: 'https://wxchatnodeexpressazure.azurewebsites.net/images/share_1.png',
    title: '提问题-ai来回答'
  },
  {
    imageUrl: 'https://wxchatnodeexpressazure.azurewebsites.net/images/share_2.jpg',
    title: '据说知道的比爱因斯坦还多！'
  },
  {
    imageUrl: 'https://wxchatnodeexpressazure.azurewebsites.net/images/share_3.png',
    title: 'ai随心聊-天文地理/古今中外'
  }
  ],
  MaxInputLength: 500,
  // chatAI的一些配置
  CHAT_AI_INFO: {
    nickName: "声语Pro",
    wellcomeTitle: "声语Pro欢迎你",
    loadingText: "。。。。。。",
  },
  /**
   * 消息类型，约定:大于0的消息是需要入库的消息
   * -1 -> UI的loading等待
   * 1 -> 用户发送的问题
   * 2 -> ChatAI的回答
   */
  MESSAGE_TYPE: { WAITING_CHATAI: -1, USER_QUESTION: 1, CHATAI_ANSWER: 2 },
  MESSAGE_ERROR_TYPE: { TIMEOUT: -1, SERVER_ERROR: -2 },
  MAX_TIMEOUT_TIME_VOICE_SPEECH: 10 * 1000, //语音识别等待10秒
  SUBSCRIBE_TEMPLATE_ID: 'MXaAWjuKPU6WlI3PZt9fof_s7o6U3r25d6CvKhNoA7Q'
};
