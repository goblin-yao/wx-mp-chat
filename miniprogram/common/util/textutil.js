// 判断文字是否为中文
function checkStringIsChinese(str) {
  var pattern = new RegExp("[\u4E00-\u9FA5]+");
  if (pattern.test(str)) {
    return true;
  }
  return false;
}
module.exports = {
  checkStringIsChinese
}