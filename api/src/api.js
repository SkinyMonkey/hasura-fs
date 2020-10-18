const fetch = require('node-fetch');

const { admin_secret, api_url } = require('./config');

function request(query, credentials, variables) {
  const body = { query };
  let headers  = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (credentials) {
    headers = Object.assign(headers, credentials)
  }

  if (variables) {
    body.variables = variables;
  }

  return fetch(api_url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  })
  .then(r => r.json())
  .then(r => {
    if (r.errors && r.errors.length > 0) {
      throw r.errors
    }

    return r.data
  })
}

const adminCredentials = { 'x-hasura-admin-secret': admin_secret };

exports.updateUserFsState = (user_id, state) => {
  const query =`mutation UpdateUserFsState($user_id: uuid!, $state: fs_user_state_enum!) {
      update_fs_user_by_pk(pk_columns: {user_id: $user_id}, _set: {state: $state}) {
        user_id
      }
  }`;

  const variables = {user_id, state};

  return request(query, adminCredentials, variables);
};

exports.getFile = (token, file_id) => {
  const query = `query GetFile($file_id: uuid!) {
      file_by_pk(id: $file_id) {
        owner_id,
        state,
        is_folder,
      }
  }`;

  const credentials = { 'authorization' : token };

  const variables = {file_id};

  return request(query, credentials, variables)
    .then((data) => data.file_by_pk)
    .then((file) => {
      if (!file) {
        const err = new Error('File not found')
        err.code = 404;
        throw err;
      }

      return file
    })
};

exports.updateFileState = (file_id, state) => {
  const query =`mutation UpdateFileState($id: uuid!, $state: file_state_enum!) {
      update_file_by_pk(pk_columns: {id: $id}, _set: {state: $state}) {
        id
      }
  }`;

  const variables = {id: file_id, state};

  return request(query, adminCredentials, variables);
};

exports.setFileAsReadyWithSize = (file_id, size) => {
  const query =`mutation UpdateFileState($id: uuid!, $size: Int!) {
      update_file_by_pk(pk_columns: {id: $id}, _set: {state: ready, size: $size}) {
        id
      }
  }`;

  const variables = {id: file_id, size};

  return request(query, adminCredentials, variables);
};
