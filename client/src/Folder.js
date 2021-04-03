// FIXME : hardcoded
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsidXNlciJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtdXNlci1pZCI6ImEwZDEzMDA5LTE4ZWMtZDdjNS00YjJmLWQ1ZWE2NzYzNmU1NiIsIngtaGFzdXJhLXBhcmVudC1pZCI6IjZhNDViNzlmLTQ4NWUtNDRlMS1hMWIzLTdlN2MzYzRjMDVlOCJ9fQ.5OZg6U1pfDcRxslgL-d_CsIPrbP4EJKaxMkJQL69Org'

// FIXME : how to download files on fs instead of just displaying them?
function downloadURI(uri, name) {
  return () => {
    let a = document.createElement("a");
    a.href = uri + '?token=' + token;
    a.setAttribute("download", name);
    a.setAttribute("target", "_blank");
    a.click();
  }
}

// TODO : format date
//        icons
//        when folder branch merged:
//    <td onClick={downloadURI("http://localhost:8000/download/" + folder.id, folder.name)}>Download</td>
function Folder({folder, onClick}) {
  return <tr className="folder" onClick={onClick}>
    <td>{folder.name}</td>
    <td></td>
    <td>{folder.created_at}</td>
    <td></td>
  </tr>
}

export default Folder;
