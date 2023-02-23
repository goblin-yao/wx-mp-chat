const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const _ = db.command;
// 消息记录表
const CHAT_MSG = "chat_messages";
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  var step = event.step;
  // 用户身份唯一识别ID
  var openid = wxContext.OPENID;
  return await db
    .collection(CHAT_MSG)
    .where({
      openid,
    })
    .skip(step)
    .limit(50)
    .orderBy("_createTime", "desc")
    .get();
};
