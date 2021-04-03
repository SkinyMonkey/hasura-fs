import logo from './logo.svg';
import './App.css';
import File from './File';
import Folder from './Folder';

import React, { useState, useEffect } from 'react';

const api_url = 'http://localhost:8080/v1/graphql';

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

const root = {file_by_pk: {name: '/'}, files: []}

function ls(parent_id) {
  const query = parent_id ?
  `query ls($parent_id: uuid!) {
    files: file(where: {parent_id: {_eq: $parent_id}}) {
          id
          size
          created_at
          is_folder
          metadata
          name
          parent_id
          state
        }
    file_by_pk(id: $parent_id) {
      id
      name
      parent_id
    }
  }`:
  `query ls {
    files: file(where: {parent_id: {_is_null: true}}) {
      id
      size
      created_at
      is_folder
      metadata
      name
      parent_id
      state
    }
  }`

  const variables = parent_id ? {parent_id} : {}

  // TODO : hardcoded
  const credentials = {
    authorization : 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsidXNlciJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtdXNlci1pZCI6ImEwZDEzMDA5LTE4ZWMtZDdjNS00YjJmLWQ1ZWE2NzYzNmU1NiIsIngtaGFzdXJhLXBhcmVudC1pZCI6IjZhNDViNzlmLTQ4NWUtNDRlMS1hMWIzLTdlN2MzYzRjMDVlOCJ9fQ.5OZg6U1pfDcRxslgL-d_CsIPrbP4EJKaxMkJQL69Org'
  }

  return request(query, credentials, variables)
    .then((data) => {
      data.file_by_pk = data.file_by_pk ? data.file_by_pk : root.file_by_pk
      return data;
    })
}

// TODO : display complete path as breadcrumb,
//        on click select folder by path?
//        redo everything by path then? => might need hasura's last version
function App() {
  const [currentFolderID, setCurrentFolderID] = useState('');
  const [current, setCurrent] = useState(root);

  useEffect(() => {
    ls(currentFolderID).then(setCurrent)
        .catch(console.error)
  }, [currentFolderID]);

  // TODO : should not display .. if there is no parent
  const parentRow = //current.file_by_pk.name == '/'
    <tr onClick={_ => setCurrentFolderID(current.file_by_pk.parent_id)}><td>..</td><td></td><td></td><td></td></tr>
//    : <tr></tr>

  return (
    <div className="App">
      <table>
        <thead>
          <tr><td>{current.file_by_pk.name}</td><td></td><td></td></tr>
          {parentRow}
        </thead>
        <tbody>
          {current.files.map((file) => {
            return file.is_folder
            ? <Folder key={file.id} folder={file} onClick={_ => { setCurrentFolderID(file.id) }}/>
            : <File   key={file.id} file={file}/>
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
