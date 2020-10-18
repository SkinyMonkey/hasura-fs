const path = require('path');
const fs = require('fs');
const util = require('util');

const fspath = '/tmp/fs/';

if (!fs.existsSync(fspath)) {
  fs.mkdirSync(fspath);
}

exports.createContainer = (container_id) => {
  const filepath = path.join(fspath, container_id);
  return util.promisify(fs.mkdir)(filepath);
}

exports.deleteContainer = (container_id) => {
  const filepath = path.join(fspath, container_id);
  return util.promisify(fs.rmdir)(filepath);
}

exports.uploadToBlob = (container_id, file_id) => {
  const filepath = path.join(fspath, container_id, file_id);

  return (req) => new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filepath)
      .on('error', reject)
      .on('finish', resolve)
      .on('ready', () => {
        req.pipe(writeStream);
      });
  });
}

exports.downloadFromBlob = (container_id, file_id) => {
  const filepath = path.join(fspath, container_id, file_id);

  return (res) => new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filepath)
      .on('error', reject)
      .on('finish', resolve)
      .on('open', () => {
        readStream.pipe(res);
      });
  });
}

exports.deleteBlob = (container_id, blob_id) => {
  return util.promisify(fs.unlink)(path.join(fspath, container_id, blob_id));
}
