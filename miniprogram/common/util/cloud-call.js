const app = getApp();
async function GetOpenData() {
  return await wx.cloud.callFunction({
    name: "openapi",
    data: {
      action: "getOpenData",
    },
  });
}
//消息合法性校验
async function MsgSecCheck(content) {
  return await wx.cloud.callFunction({
    name: "openapi",
    data: {
      action: "msgSecCheck",
      content: content
    },
  });
}
module.exports = {
  GetOpenData,
  MsgSecCheck,
};
