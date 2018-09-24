import nock from 'nock';
import os from 'os';
import { promises } from 'fs';
import { join, sep } from 'path';

import loader from '../src';

// @flow

describe('Page Loader', () => {
  const uri = 'http://ru.hexlet.io';
  const expectedFilename = 'ru-hexlet-io.html'
  const data = '<html><head></head><body>test data</body></html>';

  beforeAll(() => {
    nock.disableNetConnect();
    nock(uri).get('/').reply(200, data);
  });

  it('Load simple page', async () => {
    expect.assertions(2);

    const tempDir = await promises.mkdtemp(join(os.tmpdir(), sep));
    const expectedPath = join(tempDir, expectedFilename);

    const storedName = await loader(uri, tempDir);
    expect(storedName).toBe(expectedPath);

    const storedData = await promises.readFile(storedName, 'utf8');
    expect(storedData).toBe(data);
  });

  it('Load wrong uri', async () => {
    expect.assertions(1);

    const tempDir = await promises.mkdtemp(join(os.tmpdir(), sep));

    await expect(loader('wrong', tempDir)).rejects.toEqual({ status: 404 });
  });

  it('Load simple page to non-existed dir', async () => {
    expect.assertions(1);
    const tempDir = await promises.mkdtemp(join(os.tmpdir(), sep));

    await expect(loader(uri, 'wrong')).rejects.toEqual({ code: 'ENOENT' });
  });
});
