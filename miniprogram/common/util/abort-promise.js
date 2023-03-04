function abortPromiseWrapper(p1) {
  let abort
  let p2 = new Promise((resolve, reject) => (abort = () => { reject({ type: 'user_abort' }) }))
  let p = Promise.race([p1, p2])
  p.abort = abort
  return p
}
module.exports = abortPromiseWrapper