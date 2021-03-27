const api = require('./api');
const normalize = require('path').normalize

function mkdirp(req, res) {
  const token = req.headers.authorization
  const { parent_id, path } = req.body.input

  const pathSplit = normalize(path).split('/')

  // TODO : check if path size > 0

  const firstPromise = api.createFolder(token, parent_id, pathSplit[0])

  pathSplit.slice(1).reduce((previousPromise, subpath) => {
    return previousPromise.then(folder => api.createFolder(token, folder.id, subpath))
  }, firstPromise)
  .then(folder => res.json({id: folder.id}))
  .catch(err => {
    console.error(err)
    // TODO : same format as the one returned by hasura?
    // TODO : check if error not a user one? can we prevent writes to parent_id if not owned for example?
    res.status(500).send({errors: ['Internal error']})
  })
}

//mkdirp({body: {input: {parent_id: "abc", path: "/a/b/c"}}})
//mkdirp({body: {input: {parent_id: "abc", path: "a/b/c"}}})
//mkdirp({body: {input: {parent_id: "abc", path: "a/b//c"}}})

exports.mkdirp = mkdirp;
