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

  // TODO : function to log call as curl

  return fetch(api_url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  })
  .then(r => r.json())
  .then(r => {
    if (r.errors && r.errors.length > 0) {
      console.log(query)
      throw r.errors
    }

    return r.data
  })
}

function requestWithToken(token, query, variables) {
  return request(query, { 'authorization' : token }, variables)
}

exports.request = request

const admin_credentials = { 'x-hasura-admin-secret': admin_secret };

exports.admin_credentials = admin_credentials;

exports.updateUserFsState = (user_id, state) => {
  const query =`mutation UpdateUserFsState($user_id: uuid!, $state: fs_user_state_enum!) {
      update_fs_user_by_pk(pk_columns: {user_id: $user_id}, _set: {state: $state}) {
        user_id
      }
  }`;

  const variables = {user_id, state};

  return request(query, admin_credentials, variables);
};

exports.createFolder = (token, parent_id, name) => {
  const query = `mutation CreateFolder($parent_id: uuid, $name: String!) {
   insert_file_one(object: {name: $name, is_folder: true, parent_id: $parent_id}) {
    id
   }
  }`

  const variables = {parent_id, name};

  return requestWithToken(token, query, variables)
    .then((data) => data.insert_file_one)
};

exports.getFile = (token, file_id) => {
  const query = `query GetFile($file_id: uuid!) {
      file_by_pk(id: $file_id) {
        owner_id,
        state,
        is_folder,
      }
  }`;

  const variables = {file_id};

  return requestWithToken(token, query, variables)
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

exports.getFolderContent = (token, folder_id) => {
  const query = `query GetFolderContent($folder_id: uuid!) {
    file(where: {parent_id: {_eq: $folder_id}}) {
      id
      name
      is_folder
      owner_id
    }
  }`

  const variables = {folder_id};

  return requestWithToken(token, query, variables)
    .then((data) => data.file)
};

exports.updateFileState = (file_id, state) => {
  const query =`mutation UpdateFileState($id: uuid!, $state: file_state_enum!) {
      update_file_by_pk(pk_columns: {id: $id}, _set: {state: $state}) {
        id
      }
  }`;

  const variables = {id: file_id, state};

  return request(query, admin_credentials, variables);
};

exports.setFileAsReadyWithSize = (file_id, size) => {
  const query =`mutation UpdateFileState($id: uuid!, $size: Int!) {
      update_file_by_pk(pk_columns: {id: $id}, _set: {state: ready, size: $size}) {
        id
      }
  }`;

  const variables = {id: file_id, size};

  return request(query, admin_credentials, variables);
};
