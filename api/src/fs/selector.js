//const s3 = require('./fs/s3');
//const azure = require('./fs/azure');
const local = require('./local');

exports.getFsBackendFromName = () => {
  switch (process.env.FS_BACKEND) {
    case 's3':
      console.log('Using s3 backend');
      throw 'S3 fs backend is not implemented yet';

    case 'azure':
      console.log('Using azure backend');
      throw 'azure fs backend is not implemented yet';

    default:
      console.log('Using local backend');
      console.warn('Files wont be persisted after reboot!');
      return local;
  }
};
