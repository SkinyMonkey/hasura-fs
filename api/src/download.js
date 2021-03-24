const path = require('path');

const common = require('./common');
const api = require('./api');
const archiver = require('archiver');

// addChildrenToArchive recursively add children of a folder to an archive
function addChildrenToArchive(token, fs, folder_id, archive, prefix) {
  console.log("Adding children of ", folder_id)
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

        return addChildrenToArchive(token, fs, file.id, archive, path.join(prefix, file.name))
      }))
    })
    .catch(console.log)
}

function downloadChildrenOf(token, fs, name, owner_id, folder_id, archive_type) {
    return (res) => new Promise((resolve, reject) => {
      const archive = archiver('zip')

      archive.on('error', (err) => {
        reject(err);
      });

      res.attachment(name + '.zip');

      archive.pipe(res)

      return addChildrenToArchive(token, fs, folder_id, archive, '')
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
        // TODO : get archive type from req?
        pipe = downloadChildrenOf(token, fs, data.name, data.owner_id, file_id, 'zip');
      } else {
        pipe = fs.downloadFromBlob(data.owner_id, file_id);
      }

      return pipe(res);
    })
    .then(() => res.end())
    .catch((err) => {
      console.log(err)
      res.status(500).send({err: 'Internal error'})
    });
};
