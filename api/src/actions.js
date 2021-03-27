const api = require('./api');
const normalize = require('path').normalize
const errors = require('./errors');

function createFolderFromPreviouslyCreatedOne(token) {
  return (previousCreatedFolderPromise, subpath) => {
    // 3 - Once the previous promise is done, we use the created folder' id
    //     as parent_id for the next one
    return previousCreatedFolderPromise.then(folder => api.createFolder(token, folder.id, subpath))
  }
}

function mkdirp(req, res) {
  const token = req.headers.authorization
  const { path, parent_id } = req.body.input

  const pathSplit = normalize(path).split('/').filter((w) => w)

  if (pathSplit.length == 0) {
    res.status(400).send(errors.action("Empty path"))
    return
  }

  // 1 - We create a promise for the first folder creation
  const firstFolderPromise = api.createFolder(token, parent_id, pathSplit[0])

  pathSplit.slice(1)
  .reduce(createFolderFromPreviouslyCreatedOne(token), firstFolderPromise) // 2 - It is passed as accumulator
  .then(folder => res.json({id: folder.id}))
  .catch(errors => {
    // FIXME : check that this is an array of error, not a communication error with hasura or something else
    //         see api.js:request()
    res.status(400).send(errors[0]) // FIXME : how to return multiple errors?
  })
}

exports.mkdirp = mkdirp;
