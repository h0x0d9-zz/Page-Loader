// @flow

import nock from 'nock';
import os from 'os';
import { promises } from 'fs';
import { join as pathJoin, sep } from 'path';

import load from '../src';

describe('Page Loader', () => {
  const host = 'http://ru.hexlet.io';
  const pageUri = '/courses';
  const sourceUri = pathJoin(host, pageUri);
  const expectedFilename = 'ru-hexlet-io-courses.html';
  const data = '<html><head></head><body>test data</body></html>';

  beforeAll(() => {
    nock.disableNetConnect();
    nock(host)
      .get('/courses')
      .reply(200, 'data');
  });

  it('Load simple page', async () => {
    expect.assertions(2);

    const tempDir = await promises.mkdtemp(pathJoin(os.tmpdir(), sep), 'utf8');
    const expectedPath = pathJoin(tempDir, expectedFilename);

    const storedName = await load(sourceUri, tempDir);
    expect(storedName).toBe(expectedPath);

    const storedData = await promises.readFile(storedName, 'utf8');
    expect(storedData).toBe(data);
  });

  it('Load wrong uri', async () => {
    expect.assertions(1);

    nock(host)
      .get('/wrong')
      .reply(404);

    try {
      const tempDir = await promises.mkdtemp(pathJoin(os.tmpdir(), sep), 'utf8');
      await load(pathJoin(host, '/wrong'), tempDir);
    } catch (e) {
      console.log(e);
      expect(e.status).toBe(404);
    }
  });

  it('Load simple page to non-existed dir', async () => {
    expect.assertions(1);

    try {
      await load(sourceUri, './wrong');
    } catch (e) {
      expect(e.code).toBe('ENOENT');
    }
  });
});
