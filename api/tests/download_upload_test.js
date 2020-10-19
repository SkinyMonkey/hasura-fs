const http = require('http');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const {exec} = require('child_process');

const {token} = require('./config');
const {request, admin_credentials} = require('../src/api');
const {fspath} = require('../src/fs/local');

function delay(t) {
  return (v)  => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(v);
      }, t);
    });
  }
}

function clearDB() {
 const query = `
      mutation MyMutation {
        delete_fs_user(where: {}) {
          returning {
            user_id
          }
        }
        delete_file(where: {}) {
          returning {
            id
          }
        }
     }`

  return request(query, admin_credentials)
}

function createUser() {
  const query = `mutation InsertUser($user_id: uuid!) {
    insert_fs_user_one(object: {user_id: $user_id}) {
      user_id
    }
  }`;

  const variables = {
    user_id: "a0d13009-18ec-d7c5-4b2f-d5ea67636e56",
  };

  return request(query, admin_credentials, variables)
    .then((data) => data.insert_fs_user_one)
}

function createFile(name) {
  const query = `mutation InsertFile($metadata: json!, $name: String!) {
      insert_file_one(object: {metadata: $metadata, name: $name}) {
        id
        owner_id
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

        resolve(data);
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
          .on('finish', resolve)
          .on('ready', () => {
            res.pipe(writeStream);
          });
      }).end();
    });
  }
}

function execute(cmd, canfail) {
  return new Promise((resolve, reject) => {
    const pid = exec(cmd, { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
      if (error) {
        if (!canfail) {
          assert.equal(error, null);
        }
      } else if (stdout) {
        assert.equal(stdout, '');
      } else {
        assert.equal(stderr, '');
      }
      
      if (stdout) {
        console.log('[API logs]----------------------------------------------------------');
        console.log(stdout)
        console.log('[End]---------------------------------------------------------------');
      }
    });

    resolve(pid);
  });
}

function fileEqual(src, dst) {
  return () => {
    const cmd = `diff ${src} ${dst}`;
    return execute(cmd);
  }
}

function fileExists(container_id, blob_id) {
  const fs_user_path = blob_id ?
    path.join(fspath, container_id, blob_id):
    path.join(fspath, container_id);

  assert.equal(fs.existsSync(fs_user_path), true)
}

// NOTES : delays are here to give time for the event to be fired and treated

describe('Basic tests', () => {
  let pid = 0;

  before(() => {
    return execute(`node main.js`, true)
      .then((process) => pid = process.pid)
      .then(delay(100))
      .then(clearDB)
      .then(delay(1000));
  })
  
  describe('Create a user', () => {
    it('should create a user', () => {
      return createUser()
        .then(delay(1000))
        .then((data) => {
          fileExists(data.user_id)
        });
    });
  });
  
  describe('File upload', () => {
    it('should create and upload a file', () => {
      const src = 'main.js';
  
      return createFile(src)
        .then(uploadFileFrom(src))
        .then(({owner_id, id}) => {
          fileExists(owner_id, id)
          return id;
        });
    });
  });
  
  describe('File download', () => {
    it('should download from a previously uploaded file', () => {
      const src = 'main.js';
      const dst = '/tmp/test';
  
      return createFile(src)
        .then(uploadFileFrom(src))
        .then(({owner_id, id}) => {
          fileExists(owner_id, id)
          return id;
        })
        .then(delay(100))
        .then(downloadFileTo(dst))
        .then(fileEqual(src, dst))
    });
  });

  after(() => {
    return execute(`kill ${pid}`)
  });
});
