// NOTE : if you're wondering why i handled everything in one route:
// this way i can define a unique url in an env variable
// and make every event use it in hasura
// less bookeeping on that side, less error prone.

const { event_secret } = require('./config');
const api = require('./api');

function createContainer(fs, user_id) {
	return fs.createContainer(user_id)
		.then(() => {
			return api.updateUserFsState(user_id, 'ready')
		})
}

function fsUserEvent(fs, event) {
  let user_id;

	switch (event.op) {
		case 'INSERT':
			user_id = event.data.new.user_id;

			return createContainer(fs, user_id)
				.then(() => {
					console.log('User fs created:', user_id);
				});

		case 'DELETE':
			user_id = event.data.old.user_id;

			return fs.deleteContainer(user_id)
				.then(() => {
					console.log('User fs deleted:', user_id);
				});

		default:
			return null
	}
}

function fileEvent(fs, event) {
	switch (event.op) {
		case 'DELETE':
      if (event.data.is_folder == true) {
        // TODO : remove files where parent_id == id?
        //        test if this is not done via cascading of parent_id foreign key
        return Promise.resolve()
      }

			let { owner_id, id, state } = event.data.old;

      if (state == 'uploading') {
        return Promise.resolve()
      }

			return fs.deleteBlob(owner_id, id)
				.then(() => {
					console.log('File blob deleted:', id);
				});

		default:
			return null
	}
}

exports.securityCheck = (req, res, next) => {
  if (req.headers['x-hasura-event-secret'] != event_secret) {
    res.status(403).send({err: 'Forbidden'})
    return
  }
  next();
}

exports.handler = (fs) => (req, res) => {
	var operation;

	switch (req.body.table.name) {
		case 'fs_user':
			operation = fsUserEvent(fs, req.body.event);
      break

		case 'file':
			operation = fileEvent(fs, req.body.event);
      break

		default:
			const err = `Unknown table : ${req.body.table.name}`;
      console.log(err)
			res.status(404).send({err});
      return
	}

	if (!operation) {
			const err = `Unknown event ${req.body.event.op} on table : ${req.body.table.name}`;
      console.log(err)
			res.status(404).send({err});
			return
	}

	operation
		.then(() => {
			res.status(200).send({});
		})
		.catch((err) => {
			console.log(err);
			res.status(500).send({err});
		});
}
