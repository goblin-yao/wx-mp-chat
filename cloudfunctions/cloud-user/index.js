const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const _ = db.command;
const CHAT_USER = "chat_users";
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  let openid = wxContext.OPENID;

  try {
    await db
      .collection(CHAT_USER)
      .doc(openid)
      .set({
        data: {
          openid,
          userInfo: event.userInfo,
        },
      });
    console.log(11111)
  } catch (error) {
    console.log(error)
  }

  return { openid };
};
