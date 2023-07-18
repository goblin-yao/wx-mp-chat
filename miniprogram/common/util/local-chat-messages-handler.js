const MAX_RECORD_SIZE = 6;
const INIT_MSG = {
  text: "",
  data: [],
};

function getKey(keyObj) {
  //key就是场景值;
  return "scenes_msg_his_" + keyObj.scenesId;
}
/**
 * 数据结构
 * {
 * text:string
 * data:[msg]
 * }
 */
function getMsgFromLS(key) {
  return wx.getStorageSync(key) || INIT_MSG;
}

function setMsgToLS(key, msgObj) {
  wx.setStorageSync(key, msgObj);
}
/**
 * 存储消息
 * @param {*} keyObj
 *  {text: "Discuss%20your%20favorite%20book%20or%20movie.", scenesId: "201"}
 * 每一个scenesId存储10条记录
 * @param {*} msg
 */
function setMsgData(keyObj, msg) {
  try {
    const key = getKey(keyObj);
    const text = keyObj.text;
    const tempMsg = getMsgFromLS(key);
    //文本不一致清空数据
    if (
      tempMsg.text &&
      decodeURIComponent(tempMsg.text) != decodeURIComponent(text)
    ) {
      tempMsg.data = [];
    }
    // 超过尺寸，把最前面的消息移除
    if (tempMsg.data.length >= MAX_RECORD_SIZE) {
      tempMsg.data.shift();
    }

    tempMsg.data.push(msg);
    tempMsg.text = text

    setMsgToLS(key, tempMsg);

    return tempMsg;
  } catch (error) {
    console.log(error);
  }
}

/**
 * 获取全部消息
 * @param {*} keyObj
 *  {text: "Discuss%20your%20favorite%20book%20or%20movie.", scenesId: "201"}
 */
function getAllMsgData(keyObj) {
  const key = getKey(keyObj);
  const text = keyObj.text;
  const tempMsg = getMsgFromLS(key);
  //文本不一致返回空
  if (decodeURIComponent(tempMsg.text) != decodeURIComponent(text)) {
    tempMsg.data = [];
  }
  return tempMsg;
}

module.exports = {
  setMsgData,
  getAllMsgData,
};
