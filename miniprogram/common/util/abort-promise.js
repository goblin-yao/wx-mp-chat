function abortPromiseWrapper(p1) {
  let abort
  let p2 = new Promise((resolve, reject) => (abort = () => { reject({ type: 'abort' }) }))
  let p = Promise.race([p1, p2])
  p.abort = abort
  return p
}
module.exports = abortPromiseWrapper