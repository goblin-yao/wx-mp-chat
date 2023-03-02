const cloud = require("wx-server-sdk");
const timeUtil = require('./timeutil');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const _ = db.command;
const CHAT_USER_LIMIT = "chat_users_limit";
const MAX_LIMIT = 5;

// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.action) {
    case "reduceLimit": {
      return reduceLimit(event, context);
    }
    case "getLimit": {
      return getLimit(event, context);
    }
    default: {
      return;
    }
  }
};

// 每天凌晨 00:01分 更新次数，
// 如果_updateTime 小于当天的 00:00分，就重置为 MAX_LIMIT - 1，默认减少一次
// 否则说明已经使用过了，直接 减少一次
async function reduceLimit(event, context) {
  const wxContext = cloud.getWXContext();
  let openid = wxContext.OPENID;
  try {
    let userLimit = await db.collection(CHAT_USER_LIMIT).doc(openid).get();
    if (userLimit.data._updateTime < timeUtil.getTodayZeroTime()) {
      await db
        .collection(CHAT_USER_LIMIT)
        .doc(openid)
        .update({
          data: {
            _updateTime: new Date().getTime(),
            chat_left_nums: MAX_LIMIT - 1,
          },
        });
      return { chat_left_nums: MAX_LIMIT - 1 };// 最新的剩余次数
    }

    let leftTimes = userLimit.data.chat_left_nums;

    if (leftTimes == 0) {
      //说明次数到了，不做处理
      return { chat_left_nums: leftTimes }; // 最新的剩余次数0次
    } else {
      leftTimes--;
    }

    await db
      .collection(CHAT_USER_LIMIT)
      .doc(openid)
      .update({
        data: {
          _updateTime: new Date().getTime(),
          chat_left_nums: leftTimes,
        },
      });
    return { chat_left_nums: leftTimes };// 最新的剩余次数0次
  } catch (error) {
    // 不存在该用户信息 新建并写入 MAX_LIMIT - 1
    await db
      .collection(CHAT_USER_LIMIT)
      .doc(openid)
      .set({
        data: {
          openid,
          chat_left_nums: MAX_LIMIT - 1,
          _updateTime: new Date().getTime(),
        },
      });
    return { chat_left_nums: MAX_LIMIT - 1 }
  }
}

// 每天凌晨 00:00分 更新次数，
// 如果_updateTime 小于当天的 00:00分，就重置为 MAX_LIMIT
async function getLimit(event, context) {
  const wxContext = cloud.getWXContext();
  //减少用户使用次数
  let openid = wxContext.OPENID;
  try {
    let userLimit = await db.collection(CHAT_USER_LIMIT).doc(openid).get();
    if (userLimit.data._updateTime < timeUtil.getTodayZeroTime()) {
      return await db
        .collection(CHAT_USER_LIMIT)
        .doc(openid)
        .set({
          data: {
            openid,
            chat_left_nums: MAX_LIMIT,
            _updateTime: new Date().getTime(),
          },
        });
    }
    return userLimit;
  } catch (error) {
    // 不存在该用户信息 新建并写入 MAX_LIMIT
    return await db
      .collection(CHAT_USER_LIMIT)
      .doc(openid)
      .set({
        data: {
          openid,
          chat_left_nums: MAX_LIMIT,
          _updateTime: new Date().getTime(),
        },
      });
  }
}
