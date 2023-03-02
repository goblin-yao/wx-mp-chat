//一些常量配置
module.exports = {
  MaxInputLength: 2000,
  // chatGPT的一些配置
  CHAT_GPT_INFO: {
    nickName: "ChatGPT",
    wellcomeTitle: "ChatGPT欢迎你",
    loadingText: "输入中...",
  },
  /**
   * 消息类型，约定:大于0的消息是需要入库的消息
   * -1 -> UI的loading等待
   * 1 -> 用户发送的问题
   * 2 -> ChatGPT的回答
   */
  MESSAGE_TYPE: { WAITING_CHATGPT: -1, USER_QUESTION: 1, CHATGPT_ANSWER: 2 },
};
