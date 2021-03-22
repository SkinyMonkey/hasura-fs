const common = require('./common');
const api = require('./api');

exports.handler = (fs) => (req, res) => {
  const { file_id } = req.params;

  return api.getFile(req.headers.authorization, file_id)
    .then((data) => {
      return data
    })
    .then(common.isFileWithState('Upload', 'uploading'))
    .then((data) => {
      const pipe = fs.uploadToBlob(data.owner_id, file_id)

      return pipe(req);
    })
    .then(() => api.setFileAsReadyWithSize(file_id, req.headers['content-length']))
    .then(() => res.end())
    .then(() => console.log('Upload done :', file_id))
    .catch((err) => {
      console.log('ERROR:', err)

      if (err.code) {
        console.log(err.message)
        res.status(err.code).send({err: err.message})
        return
      }

      res.status(500).send({err: 'Internal error'})
      return api.updateFileState(file_id, 'error')
    })
};
