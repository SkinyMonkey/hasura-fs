const common = require('./common');
const api = require('./api');

// FIXME : handle req.on('aborted')?
exports.handler = (fs) => (req, res) => {
  const { file_id } = req.params;

  return api.getFile(req.headers.authorization, file_id)
    .then(common.isFileWithState('Download', 'ready'))
    .then((data) => {
      const pipe = fs.downloadFromBlob(data.owner_id, file_id);

      return pipe(res);
    })
    .then(() => res.end())
    .catch((err) => {
      console.error(err)
      res.status(500).send({err: 'Internal error'})
    });
};
