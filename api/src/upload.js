const common = require('./common');
const api = require('./api');

exports.handler = (fs) => (req, res) => {
  const { file_id } = req.params;

  return api.getFile(req.headers.authorization, file_id)
    .then((data) => {
      // TODO : check if user is owner_id or has permission as owner or writer on file
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
      if (err.code) {
        console.error(err.message)
        res.status(err.code).send({err: err.message})
        return
      }

      console.error(err)
      res.status(500).send({err: 'Internal error'})
      return api.updateFileState(file_id, 'error')
    })
};
