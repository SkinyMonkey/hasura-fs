const api = require('./api');

function mkdirp(req, res) {
  const { parent_id, path } = req.body.input;

  const pathSplit = path.split('/')

  pathSplit.forEach((subpath) => {
    if (!subpath) return
    const folder = api.createFolder(req.headers.authorization, parent_id, subpath)
                      .catch((err) => {
                        // FIXME : check errors
                        console.error(err)
                        res.status(500).send({err: 'Internal error'})
                      })
    parent_id = folder.id
  })

  // FIXME: DEBUG
  return

  // success
  return res.json({
    id: "<value>"
  })
};

mkdirp({body: {input: {parent_id: "abc", path: "/a/b/c"}}})
mkdirp({body: {input: {parent_id: "abc", path: "a/b/c"}}})
mkdirp({body: {input: {parent_id: "abc", path: "a/b//c"}}})

exports.mkdirp = mkdirp;
