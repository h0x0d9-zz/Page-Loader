const fsErrors = new Map([
  ['ENOENT', e => (`No such directory ${e.path} for save page`)],
  ['ENOTDIR', e => (`${e.path} is not a directory`)],
  ['EACCES', e => (`Permission denied for directory ${e.path}`)],
  ['ENOTFOUND', e => (`Invalid address ${e.config.url}`)],
  ['ECONNREFUSED', e => (`No connection for ${e.config.url}`)],
  ['EEXIST', e => (`Directory for assets '${e.path}' already exists`)],
]);

export default e => (fsErrors.has(e.code) ? fsErrors.get(e.code)(e) : e);
