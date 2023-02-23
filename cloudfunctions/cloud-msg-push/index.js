const cloud = require("wx-server-sdk");
const crypto = require("crypto");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const _ = db.command;
// 时间工具类
const timeUtil = require("./timeutil");

// 用户信息记录表
const CHAT_MSG = "chat_messages";
// 用户禁言名单
const CHAT_BAN_USERS = "chat_ban_users";

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  // 获取用户唯一身份识别ID
  let openid = wxContext.OPENID || event.openid;
  // 获取消息类型
  let msgType = event.msgType;
  // 根据用户openid 查询用户是否在黑名单内
  let banData = null;
  try {
    banData = await db.collection(CHAT_BAN_USERS).doc(openid).get();
    let userBan = banData.data;
    if (userBan.ban_date > 0) {
      // 用户禁言时间大于 0
      return {
        code: 300,
        msg: "禁言时长还剩" + userBan.ban_date + "天",
      };
    }
  } catch (error) {
    console.log("--无禁言记录--");
  }

  // 根据消息类型 -- 进行不同逻辑处理
  switch (msgType) {
    // 1表示文字信息
    case 1: {
      // 获取消息主体内容
      let content = event.data.text;
      return await db.collection(CHAT_MSG).add({
        data: {
          openid,
          msgType,
          content,
          attachment: '',
          _createTime: db.serverDate(),
        },
      });
      break;
    }
    // 2表示chatgpt的答案
    case 2: {
      // 获取消息主体内容，todo 从节省存储空间考虑，再确定到底需要存储哪些信息到attachment中
      let chatGPTText = event.data.text;
      return await db.collection(CHAT_MSG).add({
        data: {
          openid,
          msgType,
          content: chatGPTText,
          attachment: event.data,
          _createTime: db.serverDate(),
        },
      });
      break;
    }
    // TBD
    case "image": {
      let content = event.content;
      let res = await ImageSafe(event.content);
      console.log(res);
      //将图片传入云存储
      const hash = crypto.createHash("md5");
      hash.update(content, "utf8");
      const md5 = hash.digest("hex");
      console.log("--文件唯一MD5编码--");
      console.log(md5);
      let upData = await cloud.uploadFile({
        cloudPath: "cloud-chat/" + md5 + ".png",
        fileContent: Buffer.from(content, "base64"),
      });
      console.log(upData);
      let fileID = upData.fileID;
      if (res.result.code == 200) {
        // 内容安全校验通过写入数据
        return await db.collection(MSG).add({
          data: {
            openid,
            msgType: 2, // 表示图片
            content: fileID,
            _createTime: timeUtil.TimeCode(),
          },
        });
      } else {
        return res.result;
      }
      break;
    }
  }
};
async function ImageSafe(content) {
  // console.log(content)
  //图片内容安全校验
  return await cloud.callFunction({
    name: "openapi",
    data: {
      action: "imgSecCheck",
      contentType: "image/png",
      value: content,
    },
  });
}
