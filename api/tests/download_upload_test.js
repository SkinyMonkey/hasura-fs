const http = require('http');
const fs = require('fs');
const assert = require('assert');
const path = require('path');
const {exec, spawn} = require('child_process');

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

function createINode(name, is_folder, parent_id) {
  if (!is_folder) {
    is_folder = false
  }
  if (!parent_id) {
    parent_id = null
  }

  const query = `mutation InsertFile($metadata: json!, $name: String!, $is_folder: Boolean!, $parent_id: uuid) {
      insert_file_one(object: {metadata: $metadata, name: $name, is_folder: $is_folder, parent_id: $parent_id}) {
        id
        owner_id
      }
  }`;

  const credentials = { 'authorization' : token };
  const variables = {name: name, metadata: {}, is_folder: is_folder, parent_id: parent_id};

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

function uploadOneFile(src, parent_id) {
  const fileName = path.basename(src)
  return createINode(fileName, false, parent_id).then(uploadFileFrom(src))
}

function walkDir(dir, cb) {
  let children = []

  return fs.promises.readdir(dir)
    .then((files) => {
      return Promise.all(files.map(f => {
        const dirPath = path.join(dir, f);
        const is_folder = fs.statSync(dirPath).isDirectory();

        if (is_folder) {
          children.push(dirPath)
        }

        return cb(dirPath, is_folder)
      }))
    })
    .then(() => Promise.all(children.map(dirPath => walkDir(dirPath, cb))))
};

function uploadFolderFrom(src) {
  return () => {
    let id = ''
    return createINode(src, true) // we create the 'first level folder'
      .then((data) => {
        let parent_id = data.id
        id = data.id

        return walkDir(src, (childSrc, is_folder) => {
          const fileName = path.basename(childSrc)

          if (is_folder) {
            return createINode(fileName, true, parent_id)
              .then(data => parent_id = data.id)
          } else {
            return uploadOneFile(childSrc, parent_id)
          }
        }) 
      })
      .then(() => id)
  }
}

function execute(cmd, canfail) {
  return new Promise((resolve, reject) => {

    const logStream = fs.createWriteStream(logsPath, {flags: 'a'});

    const scmd = cmd.split(' ')
    const api = spawn(scmd[0], scmd.slice(1));

    api.stderr.on('data', () => {
      if (!canfail) {
        execute(`kill ${api.pid}`)
      }
    })

    api.stdout.pipe(logStream);
    api.stderr.pipe(logStream);

    resolve(api)
  })
}

function fileExists(container_id, blob_id) {
  const fs_user_path = blob_id ?
    path.join(fspath, container_id, blob_id):
    path.join(fspath, container_id);

  assert.equal(fs.existsSync(fs_user_path), true)
}

const logsPath = '/tmp/logs.txt'

// NOTES : delays are here to give time for the event to be fired and treated

describe('Basic tests', () => {
  let pid = 0;

  before(() => {
    execute(`rm ${logsPath}`)
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
  
      return uploadOneFile(src)
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
  
      return uploadOneFile(src)
        .then(({owner_id, id}) => {
          fileExists(owner_id, id)
          return id;
        })
        .then(delay(100))
        .then(downloadFileTo(dst))
        .then(() => execute(`diff ${src} ${dst}`))
    });
  });

  describe('Folder download', () => {
    it('should download from a previously uploaded folder with children', () => {
      const src = 'src';
      const dst = '/tmp/zip';
      const zipfile = dst + '/test.zip';
  
      return execute(`rm -rf ${dst}`)
        .then(() => execute(`mkdir ${dst}`))
        .then(uploadFolderFrom(src))
        .then(delay(100))
        .then(downloadFileTo(zipfile))
        .then(() => execute(`unzip ${zipfile} -d ${dst}`))
        .then(() => execute(`rm -rf ${zipfile}`))
        .then(() => execute(`diff -qr ${src} ${dst}`)) // FIXME : would it fail if different?
    });
  });

  after(() => {
    return execute(`kill ${pid}`)
  });
});
