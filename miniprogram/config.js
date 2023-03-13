const cloudConfigs = {
  prod: { ServerEnv: "prod-3gqv2g55fbf85d86", SericeName: "express-wjw3" },
  test: { ServerEnv: "test-1glra4je5fec5838", SericeName: "express-dfat" },
};
module.exports = {
  ADMIN_OPENID: ['o9Onv5BcWuj8o8-78-N1S-HTur7k'],
  CloudInfo: cloudConfigs.prod, // 发布时记得更改为 prod
  LocalDevMode: 0, //本地开发模式的选项
};
