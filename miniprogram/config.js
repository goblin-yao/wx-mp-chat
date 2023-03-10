const cloudConfigs = {
  prod: { ServerEnv: "prod-3gqv2g55fbf85d86", SericeName: "express-wjw3" },
  test: { ServerEnv: "test-1glra4je5fec5838", SericeName: "express-dfat" },
};
module.exports = {
  CloudInfo: cloudConfigs.prod, //发布时记得更改
  // RemoteHttpDomain: 'https://wxchatnodeexpressazure.azurewebsites.net',
  LocalDevMode: 0, //本地开发模式的选项
};
