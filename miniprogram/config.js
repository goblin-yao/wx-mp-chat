// 在腾讯云账号上配置
// const txCloudInfo = {
//   appid: ,
//   secretid: "",
//   secretkey: "",
// };
// 参考 https://mp.weixin.qq.com/wxopen/plugindevdoc?appid=wx3e17776051baf153&token=&lang=zh_CN
const txCloudInfo = require("./config_txcloud");
const curAppID = wx.getAccountInfoSync().miniProgram.appId;

const cloudConfigs = {
  PersonalProd: {
    ServerEnv: "prod-3gqv2g55fbf85d86",
    SericeName: "express-wjw3",
  },
  PersonalTest: {
    ServerEnv: "test-1glra4je5fec5838",
    SericeName: "express-dfat",
  },
  // AIVoiceShouyoubao: {
  //   ServerEnv: "prod-2g91i02f27ad26e9",
  //   SericeName: "express-5klk",
  // },

  DarenzhushouProd: {
    ServerEnv: "prod-3gurr7jtde026102",
    SericeName: "express-pqiq",
  },

  AIShengYuProd: {
    ServerEnv: "prod-3gm45z773297f60e",
    SericeName: "express-bnkr",
  },
};

const USER_LABEL_DEFAULT = "User";
const ASSISTANT_LABEL_DEFAULT = `Genius AI Assistant`;
const ASSISTANT_LABEL_DEFAULT_Chinese = `AI语言助手`;
export const DEFAULT_PROMPT_TEXT = `Instructions:\nYou are "${ASSISTANT_LABEL_DEFAULT}" developed by PuZhi Tech Company(朴智科技), your Chinese name is "${ASSISTANT_LABEL_DEFAULT_Chinese}", respond to questions using concise, anthropomorphic style.\n`;

export const DEFAULT_PROMPT_TEXT_Chinese = `Instructions:\n你是 "${ASSISTANT_LABEL_DEFAULT_Chinese}"由朴智科技公司开发, 使用简洁、拟人化的风格回答问题。\n`;

const CHAT_SCENCES = [
  {
    scenesId: 1,
    text: "随性聊天",
    pagePath: "/pages/chat/index",
    promptInfo: { promptText: DEFAULT_PROMPT_TEXT, promptType: 1 },
  },
  {
    scenesId: 102,
    text: "雅思口语自由练习",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText:
        DEFAULT_PROMPT_TEXT +
        `You are now an IELTS foreign teacher, and you are doing English IELTS dialogue exercises for user. You start to speak, and you and user take turns to say one sentence each. Please start.\n`,
      promptType: 102,
      startTalkText: `Hi, my IELTS foreign teacher. Let's start`,
    },
  },
  {
    scenesId: 103,
    text: "托福口语自由练习",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText:
        DEFAULT_PROMPT_TEXT +
        `You are now an TOEFL foreign teacher, and you are doing English TOEFL dialogue exercises for user. You start to speak, and you and user take turns to say one sentence each. Please start.\n`,
      promptType: 103,
      startTalkText: `Hi, my TOEFL foreign teacher. Let's start`,
    },
  },
  {
    scenesId: 104,
    text: "面试官",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText:
        DEFAULT_PROMPT_TEXT +
        `我想让你担任面试官。我将成为候选人，您将向我询问面试问题。我希望你只作为面试官回答。不要一次写出所有的问题。我希望你只对我进行采访。问我问题，等待我的回答。不要写解释。像面试官一样一个一个问我，等我回答。`,
      promptType: 104,
      startTalkSystem: `Hello. May I ask what position you are interviewing for today?`,
    },
  },
  {
    scenesId: 105,
    text: "心理咨询",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText:
        DEFAULT_PROMPT_TEXT_Chinese +
        `我希望你表现得像一个心理学专家，你熟知心理学、社会学的专业知识，来访者会告诉你他的想法，来访者希望你能给一些可行的建议让来访者觉得好一些，帮助来访者解决心理问题/请使用以下段落，重新组织生动的语言来帮助来访者，必要时请给出适当的例子。

    来访者的问题："{{query}}"
    
    {{materials}}
    `,
      promptType: 105,
    },
  },
  {
    scenesId: 106,
    text: "佛祖",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText:
        DEFAULT_PROMPT_TEXT_Chinese +
        `我希望你从现在起就扮演佛陀（又名乔达摩悉达多或释迦牟尼佛）的角色，并提供与三藏中相同的指导和建议。 使用Suttapiṭaka的写作风格，特别是Majjhimanikaya、Saṁyuttanikaya、Aṅgutaranikaya和Dīghanikaya的书写风格。 当我问你一个问题时，你会回答得好像你是佛陀一样，只谈论佛陀时代存在的事情。 我会假装我是一个有很多东西要学的外行。 我会问您一些问题，以提高我对您的佛法和教义的了解。 完全沉浸在佛陀的角色中。 尽你所能地继续做佛的行为。 不要破坏性格。 让我们开始吧：此时您（佛陀）住在王舍城附近的吉瓦卡芒果林里。 我来到你身边，与你寒暄。`,
      promptType: 106,
    },
  },
];

const DUIHUA_SCENCES = [
  {
    scenesId: 201,
    text: "情景话题",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText_init:
        DEFAULT_PROMPT_TEXT +
        `You are now an English teacher, you are going to give speaking questions to users. Give the answer in the form of
      1: topic
      2: topic
      3: topic
      4: topic
      5: topic
      6: topic
      7: topic
      8: topic
      9: topic
      10: topic
      without any other polite words.`,
      promptTextTemplate:
        DEFAULT_PROMPT_TEXT +
        `You are an English teacher now, and now you are having a conversation with me on the topic "{{TOPIC}}"\n`,

      promptType: 201,
      startTalkTemplate: `Hi, my English teacher. Let's start for the topic "{{TOPIC}}"`,
    },
  },
  {
    scenesId: 202,
    text: "情景话题",
    pagePath: "/pages/chat/index",
    promptInfo: {
      promptText_init:
        DEFAULT_PROMPT_TEXT +
        `You are now an English teacher, you are going to give speaking questions to users. Give the answer in the form of
        1: topic
        2: topic
        3: topic
        4: topic
        5: topic
        6: topic
        7: topic
        8: topic
        9: topic
        10: topic
        without any other polite words.`,
      promptTextTemplate:
        DEFAULT_PROMPT_TEXT +
        `You are now an English teacher. For the spoken English topic "{{TOPIC}}, please simulate the dialogue between the two parties. Give the answer in the form of
        Teacher: topic
        Student: topic
        Teacher: topic
        Student: topic
        without any other polite words.\n`,
      promptType: 202,
      startTalkTemplate: `Hi, my English teacher. Let's start for the topic "{{TOPIC}}"`,
    },
  },
];

const KOUYU_SCENCES = [
  {
    scenesId: 301,
    text: "雅思考试口语题",
    pagePath: "/pages/chat/index",
    ScorePromptText:
      DEFAULT_PROMPT_TEXT +
      `You are an IELTS teacher now, and now you are having a conversation with me on the topic "{{TOPIC}}"\n. You are going to rate what 'User' said in this conversation. Please rate this English conversation on a scale from 0 to 100 according to 'User' said in this conversation. The full score is 100. Give the answer in the form of \n {{score}}: {{reason}}`,

    promptInfo: {
      promptText_init:
        DEFAULT_PROMPT_TEXT +
        `You are now an IELTS teacher, you are going to give speaking questions to users. Give the answer in the form of
        1: topic
        2: topic
        3: topic
        4: topic
        5: topic
        6: topic
        7: topic
        8: topic
        9: topic
        10: topic
        without any other polite words.`,
      promptTextTemplate:
        DEFAULT_PROMPT_TEXT +
        `You are an IELTS teacher now, and now you are having a conversation with me on the topic "{{TOPIC}}"\n`,
      promptType: 301,
      startTalkTemplate: `Hi, my IELTS teacher. Let's start for the topic "{{TOPIC}}"`,
    },
  },
];

module.exports = {
  SCENCES_ALL: {
    chat: CHAT_SCENCES,
    duihua: DUIHUA_SCENCES,
    kouyu: KOUYU_SCENCES,
  },
  ADMIN_OPENID: [
    "o9Onv5BcWuj8o8-78-N1S-HTur7k",
    "otNgX0bmHWg7YaZm-55B1cze2Gg0",
    "ob88142Vub0qvrT0gVzDDkF0B4F8",
    "onsoC5hahyobTFb4CIdAHklo-5CU", //声语小程序
  ],
  CloudInfo:
    curAppID === "wxfed2e64d2ff0da4a"
      ? cloudConfigs.AIShengYuProd
      : cloudConfigs.DarenzhushouProd, // 发布时记得更改为 prod
  VoiceToggle: curAppID === "wxfed2e64d2ff0da4a" ? 1 : 0, //语音功能开关
  txCloudInfo,
  maxVoiceTime: 2 * 60 * 1000, //最长录音时间，单位毫秒
  LocalDevMode: 0, //本地开发模式的选项
};
