const http = require('http');
const fs = require('fs');
const assert = require('assert');
const { exec} = require('child_process');

const {token} = require('./config');
const {request} = require('../src/api.js');

function delay(t) {
  return (v)  => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(v);
      }, t);
    });
  }
}

function createFile(name) {
  const query = `mutation InsertFile($metadata: json!, $name: String!) {
      insert_file_one(object: {metadata: $metadata, name: $name}) {
        id
      }
  }`;

  const credentials = { 'authorization' : token };
  const variables = {name: name, metadata: {}};

  return request(query, credentials, variables)
    .then((data) => data.insert_file_one)
}

function uploadFileFrom(src) {
  return (data) => {
    return new Promise((resolve, reject) => {
      const stats = fs.statSync(src);

      const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/upload/' + data.id,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': stats.size,
          'Authorization': token,
        }
      }

      const req = http.request(options, (res) => {
        if (res.statusCode != 200) {
          throw res.statusCode
        }

        resolve(data.id);
      });

      fs.createReadStream(src, { highWaterMark: 500 })
        .on('error', reject)
        .pipe(req);
    });
 }
}

function downloadFileTo(dst) {
  return (file_id) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 8000,
        path: '/download/' + file_id,
        method: 'GET',
        headers: {
          'Authorization': token,
        }
      }

      const req = http.request(options, (res) => {
        if (res.statusCode != 200) {
          reject(res.statusCode)
          return
        }

        const writeStream = fs.createWriteStream(dst, { highWaterMark: 500 })
          .on('error', reject)
          .on('end', resolve)
          .on('ready', () => {
            res.pipe(writeStream);
          });
      }).end();
    });
  }
}

function fileEqual(src, dst) {
  return () => {
    return new Promise((resolve, reject) => {
    const cmd = `diff ${src} ${dst}`;
    exec(cmd, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
        if (error) {
          assert.equal(error, null);
        } else if (stdout) {
          assert.equal(stdout, '');
        } else {
          assert.equal(stderr, null);
        }
        resolve(stdout ? true : false);
      });
    });
  };
}

describe('File upload', () => {
  it('should create and upload a file', () => {
    const src = 'main.js';

    createFile(src)
      .then(uploadFileFrom(src))
      .catch((err) => assert.equal(err, null))
  });
});

describe('File download', () => {
  it('should download from a previously uploaded file', () => {
    const src = 'main.js';
    const dst = '/tmp/test';

    createFile(src)
      .then(uploadFileFrom(src))
      .then(downloadFileTo(dst))
      .then(fileEqual(src, dst))
      .catch((err) => assert.equal(err, null))
  });
});
