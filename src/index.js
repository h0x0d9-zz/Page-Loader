// @flow

import url from 'url';
import debug from 'debug';
import { promises } from 'fs';
import path from 'path';
import cheerio from 'cheerio';
import Listr from 'listr';
import axios from './lib/axios';
import getErrorMsg from './lib/core/errno';

const log = debug('page-loader');

const renderer = process.argv[2];

const tagsFilter = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const fetchData = (link: string): Promise<string> => axios
  .get(link, { responseType: 'arraybuffer' })
  .then(({ data }) => data);

const saveFile = (destLink: string,
  data: string): Promise<void> => promises.writeFile(destLink, data);

const createFilename = (link: string): string => {
  const { host, pathname } = url.parse(link);
  const newPathname = pathname && pathname.length === 1 ? '' : pathname;
  const filename = [host, newPathname]
    .join('').replace(/\W|_/gi, '-');
  return filename;
};

const createAssetPath = (link: string, destDir: string): string => {
  const { dir, name, ext } = path.parse(link);
  const filename = [createFilename(path.join(dir, name)), ext].join('');
  const filePath = path.join(destDir, filename);
  return filePath;
};

const pullAssets = (assetsLinks: string[],
  assetsHost: string, destDir: string): Promise<[string, boolean][]> => {
  const tasks = new Listr(assetsLinks.map(link => ({
    title: link,
    task: () => {
      const fullLink = url.resolve(assetsHost, link);
      const filePath = createAssetPath(link, destDir);

      log('Starting fetch asset %o (%o)', link, fullLink);
      return fetchData(fullLink)
        .then((data) => {
          log('Asset %o successfull fetched', link);
          return promises.writeFile(filePath, data);
        })
        .catch((e) => {
          const msg = e.response
            ? `Failed to load ${fullLink}. The server responded with a status of ${e.response.status}`
            : e;
          throw new Error(msg);
        });
    },
  })), { exitOnError: false, renderer });

  log('Starting pull assets %o from host %o to %o', assetsLinks, assetsHost, destDir);
  return tasks.run().catch(() => Promise.resolve());
};

const localizeLinks = (html: string, links: string[], destDir: string): string => {
  const $ = cheerio.load(html);
  const linksSet = new Set(links);

  Object.keys(tagsFilter).forEach(tag => $(tag).filter((i, el) => {
    const link = $(el).attr(tagsFilter[tag]);
    return linksSet.has(link);
  }).each((i, el) => {
    const link = $(el).attr(tagsFilter[tag]);
    const newLink = createAssetPath(link, destDir);
    $(el).attr(tagsFilter[tag], newLink);
  }));

  return $.html();
};

const getLinks = (html: string): string[] => {
  const $ = cheerio.load(html);
  return Object.keys(tagsFilter)
    .reduce((acc, tag) => ([
      ...acc,
      ...$(tag).map((i, el) => $(el).attr(tagsFilter[tag])).get(),
    ]), [])
    .filter(link => !!link);
};

export default (sourceLink: string, destDir: string = './'): Promise<any> => {
  log('Start module: page-loader  with params sourceLink=%o destDir=%o', sourceLink, destDir);

  const filename = createFilename(sourceLink);
  const assetsDirName = [filename, '_files'].join('');
  const destPath = path.resolve(destDir, [filename, 'html'].join('.'));
  const assetsPath = path.resolve(destDir, assetsDirName);

  log('result destPath = %o', destPath);

  return promises.readdir(destDir, 'utf8')
    .then(() => log('Fetching %o', sourceLink))
    .then(() => fetchData(sourceLink))
    .then((html) => {
      log('Page %o was succesfull fetched', sourceLink);
      const links = getLinks(html).filter((link) => {
        const { hostname } = url.parse(link);
        return !hostname || hostname.length === 0;
      });

      const processedHtml = localizeLinks(html, links, assetsDirName);
      return saveFile(destPath, processedHtml).then(() => links);
    })
    .then(links => promises.mkdir(assetsPath).then(() => links))
    .then(links => pullAssets(links, sourceLink, assetsPath))
    .catch((e) => {
      const msg = e.response
        ? `Failed to load page: ${sourceLink}. The server responded with a status of ${e.response.status}`
        : getErrorMsg(e);
      console.error(msg);
      throw new Error(msg);
    })
    .then(() => destPath);
};
