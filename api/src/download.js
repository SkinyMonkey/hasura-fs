const path = require('path');

const common = require('./common');
const api = require('./api');
const archiver = require('archiver');

// addChildrenToArchive recursively add children of a folder to an archive
function addChildrenToArchive(token, folder_id, archive, prefix) {
  return api.getFolderContent(token, folder_id)
    .then((files) => {
      return Promise.all(files.map((file) => {
        if (!file.is_folder) {
          let entryData = { name: file.name }
          if (prefix != '') {
            entryData.prefix = prefix
          }
          archive.append(fs.streamFromBlob(file.owner_id, file.id), entryData)
          return Promise.resolve()
        }

        // FIXME : right prefix? might need a / in front of it?
        return addChildrenToArchive(token, file.id, archive, path.join(prefix, file.name))
      }))
    })
}

// TODO : see https://amiantos.net/zip-multiple-files-on-aws-s3/
function downloadChildrenOf(token, fs, name, owner_id, folder_id, archive_type) {
    return (res) => new Promise((resolve, reject) => {
      const archive = archiver('zip')

      archive.on('error', (err) => {
        reject(err);
      });

      res.attachment(name + '.zip');

      archive.pipe(res)

      return addChildrenToArchive(token, folder_id, archive, '')
        .then(() => archive.finalize())
        .then(resolve)
    })
}

exports.handler = (fs) => (req, res) => {
  const { file_id } = req.params;
  const token = req.headers.authorization

  return api.getFile(token, file_id)
    .then(common.hasState('Download', 'ready'))
    .then((data) => {
      let pipe = null;

      if (data.is_folder) {
        pipe = fs.downloadChildrenOf(token, fs, data.name, data.owner_id, file_id, 'zip'); // TODO : get archive type from req?
      } else {
        pipe = downloadFromBlob(fs, data.owner_id, file_id);
      }

      return pipe(res);
    })
    .then(() => res.end())
    .catch((err) => {
      console.log(err)
      res.status(500).send({err: 'Internal error'})
    });
};
