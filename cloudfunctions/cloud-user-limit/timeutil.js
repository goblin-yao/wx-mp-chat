function getTodayZeroTime() {
  return new Date(new Date().toLocaleDateString()).getTime();
}
module.exports = {
  getTodayZeroTime,
}