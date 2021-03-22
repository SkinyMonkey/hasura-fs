// TODO : split if possible?

exports.hasState = (action, state) => (data) => {
  if (data.is_folder) { // no need to check state for a folder
    return data;
  }

  if (data.state != state) {
    const msg = `${action} only works with a file in ${state} state`;
    err = new Error(msg)
    err.code = 400
    throw err
  }

  return data;
}

exports.isFileWithState = (action, state) => (data) => {
  if (data.is_folder) {
    const msg = `${action} only works with a file`;
    err = new Error(msg)
    err.code = 400
    throw err
  }

  if (data.state != state) {
    const msg = `${action} only works with a file in ${state} state`;
    err = new Error(msg)
    err.code = 400
    throw err
  }

  return data;
}
