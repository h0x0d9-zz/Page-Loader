import nock from 'nock';
import os from 'os';
import { promises } from 'fs';
import { join as pathJoin, sep } from 'path';
import { resolve as resolveUrl } from 'url';
import load from '../src';

describe('Page Loader', () => {
  const host = 'http://ru.hexlet.io';
  const pageUri = '/courses';
  const sourceUri = resolveUrl(host, pageUri);
  const expectedFilename = 'ru-hexlet-io-courses.html';
  const data = '<html><head></head><body>test data</body></html>';

  beforeAll(() => {
    nock.disableNetConnect();
  });

  it('Load simple page', async () => {
    nock(host)
      .get(pageUri)
      .reply(200, data);

    const tempDir = await promises.mkdtemp(pathJoin(os.tmpdir(), sep), 'utf8');
    const expectedPath = pathJoin(tempDir, expectedFilename);

    const storedName = await load(sourceUri, tempDir);
    expect(storedName).toBe(expectedPath);

    const storedData = await promises.readFile(storedName, 'utf8');
    expect(storedData).toBe(data);
  });

  it('Load broken uri', async () => {
    nock(host)
      .get('/wrong')
      .reply(404);

    try {
      const tempDir = await promises.mkdtemp(pathJoin(os.tmpdir(), sep), 'utf8');
      await load(resolveUrl(host, '/wrong'), tempDir);
    } catch (e) {
      expect(e.response.status).toBe(404);
    }
  });

  it('Load simple page to no entity directory', async () => {
    nock(host)
      .get('/')
      .reply(200, data);

    try {
      await load(sourceUri, pathJoin(os.tmpdir(), '/wrong'));
    } catch (e) {
      expect(e.code).toBe('ENOENT');
    }
  });
});
