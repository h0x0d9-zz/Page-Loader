// @flow

import url from 'url';
import debug from 'debug';
import { promises } from 'fs';
import { join as joinPath } from 'path';
import axios from './axiosWrapper';

const log = debug('loader:app');

const fetchData = (link: string): Promise => axios.get(link).then(({ data }) => data);

const saveFile = (destLink: string, data: string) => promises.writeFile(destLink, data);

const createFilename = (link: string, ext: string): string => {
  const { host, pathname } = url.parse(link);
  const newPathname = pathname.length === 1 ? '' : pathname;
  const filename = [host, newPathname]
    .join('').replace(/[^a-zA-Z0-9]/gi, '-');

  log('result filename = %o', filename);

  return [filename, ext].join('.');
};

export default (sourceLink: string, destDir: string = './'): Promise => {
  log('Start module: page-loader  with params sourceLink=%o destDir=%o', sourceLink, destDir);

  const fileName = createFilename(sourceLink, 'html');
  const path = joinPath(destDir, fileName);

  return promises.readdir(destDir, 'utf8')
    .then(() => fetchData(sourceLink))
    .then(data => saveFile(path, data))
    .then(() => path)
    .catch((err) => {
      throw err;
    });
};
