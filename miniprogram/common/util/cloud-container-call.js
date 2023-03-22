const Config = require("../../config");

/**
 *判断对象是否是一个纯粹的对象
 */
function isPlainObject(obj) {
  return (
    typeof obj === "object" &&
    Object.prototype.toString.call(obj) === "[object Object]"
  );
}
/**
 *深度合并两个对象的方法
 */
function deepAssign(target, source) {
  if (isPlainObject(source)) {
    if (!isPlainObject(target)) {
      target = {};
    }
    for (let s in source) {
      if (s === "__proto__" || target === source[s]) {
        continue;
      }
      if (isPlainObject(source[s])) {
        target[s] = deepAssign(target[s], source[s]);
      } else {
        target[s] = source[s];
      }
    }
    return target;
  }
}

module.exports = (option) => {
  return wx.cloud.callContainer(
    deepAssign(
      {
        config: {
          env: Config.CloudInfo.ServerEnv,
        },
        header: {
          "X-WX-SERVICE": Config.CloudInfo.SericeName,
          "content-type": "application/json",
        },
        timeout: 60000,
        method: "POST",
      },
      option
    )
  );
};
