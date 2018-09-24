import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

import debug from 'debug';

const log = debug('page-loader::');

axios.defaults.adapter = httpAdapter;

// @flow

export default (sourceLink: string, destPath: string = './') => {
  log(sourceLink, destPath);
};
