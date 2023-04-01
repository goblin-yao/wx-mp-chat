// 在腾讯云账号上配置
// const txCloudInfo = {
//   appid: ,
//   secretid: "",
//   secretkey: "",
// };
// 参考 https://mp.weixin.qq.com/wxopen/plugindevdoc?appid=wx3e17776051baf153&token=&lang=zh_CN
const txCloudInfo = require("./config_txcloud");

const cloudConfigs = {
  PersonalProd: {
    ServerEnv: "prod-3gqv2g55fbf85d86",
    SericeName: "express-wjw3",
  },
  PersonalTest: {
    ServerEnv: "test-1glra4je5fec5838",
    SericeName: "express-dfat",
  },
  AIVoiceShouyoubao: {
    ServerEnv: "prod-2g91i02f27ad26e9",
    SericeName: "express-5klk",
  },

  DarenzhushouProd: {
    ServerEnv: "prod-3gurr7jtde026102",
    SericeName: "express-pqiq",
  },
};

module.exports = {
  ADMIN_OPENID: [
    "o9Onv5BcWuj8o8-78-N1S-HTur7k",
    "otNgX0bmHWg7YaZm-55B1cze2Gg0",
    "ob88142Vub0qvrT0gVzDDkF0B4F8"
  ],
  CloudInfo: cloudConfigs.DarenzhushouProd, // 发布时记得更改为 prod
  VoiceToggle: 1, //语音功能开关
  txCloudInfo,
  maxVoiceTime: 30 * 1000, //最长录音时间，单位毫秒
  LocalDevMode: 0, //本地开发模式的选项
};
