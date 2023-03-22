const cloudConfigs = {
  prod: { ServerEnv: "prod-3gqv2g55fbf85d86", SericeName: "express-wjw3" },
  test: { ServerEnv: "test-1glra4je5fec5838", SericeName: "express-dfat" },
  AIVoice: { ServerEnv: "prod-2g91i02f27ad26e9", SericeName: "express-5klk" }
};
//国内版
// const txCloudInfo = {
//   appid: 1303066095,
//   secretid: "AKID3seKkvqTpuhJm01HJ8kIeolTvHSyEFCt",
//   secretkey: "V8bqthJjxiOrIArJVP6YjyzkLiqkPs5w",
//   maxVoiceTime: 30 * 1000, //单位毫秒
// };
//海外版
const txCloudInfo = {
  appid: 1317351780,
  secretid: "IKIDZK0WrzvfDZlmz1ukREvQlupxxmNkV4Qc",
  secretkey: "4weAYlr13wcGj281hCZkkX9YkkZBct0u",
  maxVoiceTime: 30 * 1000, //单位毫秒
};

module.exports = {
  ADMIN_OPENID: [
    "o9Onv5BcWuj8o8-78-N1S-HTur7k",
    "otNgX0bmHWg7YaZm-55B1cze2Gg0",
  ],
  CloudInfo: cloudConfigs.AIVoice, // 发布时记得更改为 prod
  VoiceToggle: 1,//语音功能开关
  LocalDevMode: 0, //本地开发模式的选项
  txCloudInfo,
};
