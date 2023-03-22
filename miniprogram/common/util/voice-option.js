const { checkStringIsChinese } = require('./textutil')
function getVoiceOption(_text) {
  return {
    speed: 0,
    volume: 0,
    voiceType: checkStringIsChinese(_text) ? 1001 : 1051, //英语就用英文音色，中文用中文的
    language: 1,
    projectId: 0,
    sampleRate: 16000,
  }
}
module.exports = {
  getVoiceOption
}