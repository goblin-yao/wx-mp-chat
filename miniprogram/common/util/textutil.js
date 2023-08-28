// 判断文字是否为中文
function checkStringIsChinese(str) {
  var pattern = new RegExp("[\u4E00-\u9FA5]+");
  if (pattern.test(str)) {
    return true;
  }
  return false;
}

const msgArray = []
// 连续三次文字一样，认为消息完成
function checkIsFinishMsg(msg) {
  if (msg?.data?.text) {
    msgArray.push(msg?.data?.text)
    //长度大于3，判断最近3条消息是否一样，如果一样，清空数组
    if (msgArray.length >= 3) {
      const tempArray = msgArray.slice(-3);
      //判断数组元素是否全部一样
      const elementsAreEqual = tempArray.every(el => el === tempArray[0])
      if (elementsAreEqual) {
        msgArray.length = 0
      }
      return elementsAreEqual
    }
    return false
  }
  return true
}

module.exports = {
  checkStringIsChinese,
  checkIsFinishMsg
}