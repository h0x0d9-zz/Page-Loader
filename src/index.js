// @flow

import url from 'url';
import debug from 'debug';
import { promises } from 'fs';
import { resolve as resolvePath } from 'path';
import axios from './lib/axios';

const log = debug('loader:app');

const fetchData = (link: string): Promise<string> => axios.get(link).then(({ data }) => data);

const saveFile = (destLink: string,
  data: string): Promise<void> => promises.writeFile(destLink, data);

const createFilename = (link: string, ext: string): string => {
  const { host, pathname } = url.parse(link);
  const newPathname = pathname && pathname.length === 1 ? '' : pathname;
  const filename = [host, newPathname]
    .join('').replace(/\W|_/gi, '-');

  log('result filename = %o', filename);

  return [filename, ext].join('.');
};

export default (sourceLink: string, destDir: string = './'): Promise<any> => {
  log('Start module: page-loader  with params sourceLink=%o destDir=%o', sourceLink, destDir);

  const fileName = createFilename(sourceLink, 'html');
  const path = resolvePath(destDir, fileName);

  log('result destPath = %o', path);

  return promises.readdir(destDir, 'utf8')
    .then(() => fetchData(sourceLink))
    .then(data => saveFile(path, data))
    .then(() => path);
};
