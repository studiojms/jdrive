import { describe, expect, jest, beforeEach, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import FormData from 'form-data';
import { tmpdir } from 'os';
import { join } from 'path';

import { logger } from '../../src/logger';
import Routes from '../../src/routes';
import TestUtil from '../util/testUtil';

describe('Routes Integration Test', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, msg) => {},
  };
  let defaultDownloadsFolder = '';

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(join(tmpdir(), 'test-downloads'));
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });

  describe('getFileStatus', () => {
    it('should upload file to the folder', async () => {
      const filename = 'test.png';
      const fileStream = fs.createReadStream(`./test/integration/mocks/${filename}`);
      const response = TestUtil.generateWritableStream(() => {});

      const form = new FormData();
      form.append('photo', fileStream);

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: 'POST',
          url: '?socketId=1',
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);

      routes.setSocketInstance(ioObj);

      const dirBefore = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirBefore).toEqual([]);

      await routes.handler(...defaultParams.values());

      const dirAfter = await fs.promises.readdir(defaultDownloadsFolder);
      expect(dirAfter).toEqual([filename]);

      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);

      const expectedEndMessage = JSON.stringify({ result: 'Files successfully uploaded' });
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedEndMessage);
    });
  });
});
