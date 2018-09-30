import nock from 'nock';
import os from 'os';
import { promises, constants } from 'fs';
import path from 'path';
import { resolve as resolveUrl } from 'url';
import load from '../src';

const exists = async p => promises.access(p, constants.R_OK).then(() => true).catch(() => false);

const encoding = 'utf-8';
const fixturesDir = '__tests__/__fixtures__';

const getFixturePath = name => path.join(fixturesDir, name);

const assets = [
  'img.png',
  'script.old.js',
  'css/custom.css',
];

const expectedAssetsFiles = [
  'img.png',
  'script-old.js',
  'css-custom.css',
];

const host = 'http://ru.hexlet.io';

const simplePageUri = '/simple';
const simpleHtml = '<html><head></head><body><div id="test"></div></body></html>';
const simpleSourceUri = resolveUrl(host, simplePageUri);
const expectedSimpleFilename = 'ru-hexlet-io-simple.html';

const fixtureFilename = 'courses.html';
const expectedFixtureFilename = 'expected.html';
const complexPageUri = '/courses/1';
const complexSourceUri = resolveUrl(host, complexPageUri);
const expectedComplexPageFilename = 'ru-hexlet-io-courses-1.html';
const expectedIncludeDirname = 'ru-hexlet-io-courses-1_files';

describe('Page Loader', () => {
  let currentTempDir = null;

  beforeAll(() => {
    nock.disableNetConnect();

    nock(host)
      .get(simplePageUri)
      .reply(200, simpleHtml);

    nock(host)
      .get(complexPageUri)
      .replyWithFile(200, getFixturePath(fixtureFilename));

    nock(host)
      .get('/wrong')
      .reply(404);

    nock(host)
      .get('/courses/assets/wrong')
      .reply(404);

    assets.forEach(asset => nock(host)
      .get(resolveUrl(complexPageUri, asset))
      .replyWithFile(200, getFixturePath(asset)));
  });

  beforeEach(async () => {
    currentTempDir = await promises.mkdtemp(path.join(os.tmpdir(), path.sep), 'utf8');
  });

  it('Load simple page without links', async () => {
    const storedName = await load(simpleSourceUri, currentTempDir);
    const expectedPath = path.join(currentTempDir, expectedSimpleFilename);
    expect(storedName).toBe(expectedPath);

    const storedData = await promises.readFile(storedName, 'utf8');
    expect(storedData).toBe(simpleHtml);
  });

  it('Load broken uri', async () => {
    try {
      await load(resolveUrl(host, '/wrong'), currentTempDir);
    } catch (e) {
      expect(e.response.status).toBe(404);
    }
  });

  it('Load simple page to no entity directory', async () => {
    try {
      await load(simpleSourceUri, path.join(os.tmpdir(), '/wrong'));
    } catch (e) {
      expect(e.code).toBe('ENOENT');
    }
  });

  // FIXME: нужно сделать проверку на вложенные локальные ресурсы
  it('Load page with local, extend and not existed assets', async () => {
    const storedName = await load(complexSourceUri, currentTempDir);
    const expectedPath = path.join(currentTempDir, expectedComplexPageFilename);
    expect(storedName).toBe(expectedPath);
    expect(await exists(storedName)).toBe(true);
    const storedHtml = await promises.readFile(storedName, encoding);

    const expectedHtml = await promises.readFile(getFixturePath(expectedFixtureFilename), encoding);
    expect(storedHtml).toEqual(expectedHtml);

    const expectedDirPath = path.join(currentTempDir, expectedIncludeDirname);
    expect(await exists(expectedDirPath)).toBe(true);

    const storedAssets = await promises.readdir(expectedDirPath, encoding);

    expect(storedAssets.sort()).toEqual(expectedAssetsFiles.sort());
  });
});
