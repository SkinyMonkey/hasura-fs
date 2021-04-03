const common = require('./common');
const api = require('./api');

exports.handler = (fs) => (req, res) => {
  const { file_id } = req.params;

  const authorization = req.headers.authorization ? req.headers.authorization : req.query.token

  return api.getFile(authorization, file_id)
    .then(common.isFileWithState('Download', 'ready'))
    .then((data) => {
      const pipe = fs.downloadFromBlob(data.owner_id, file_id);

      return pipe(res);
    })
    .then(() => res.end())
    .catch((err) => {
      console.log(err)
      res.status(500).send({err: 'Internal error'})
    });
};
