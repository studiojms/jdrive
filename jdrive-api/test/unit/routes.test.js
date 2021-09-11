import { describe, expect, jest, beforeEach } from '@jest/globals';

import { logger } from '../../src/logger.js';
import Routes from '../../src/routes.js';
import UploadHandler from '../../src/uploadHandler.js';
import TestUtil from '../util/testUtil.js';

describe('Routes', () => {
  const req = TestUtil.generateReadableStream(['some bytes']);
  const res = TestUtil.generateWritableStream(() => {});

  const defaultParams = {
    request: Object.assign(req, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      method: '',
      body: {},
    }),
    response: Object.assign(res, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams),
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });

  describe('constructor', () => {
    it('should create a new instance with socket instance', () => {
      const ioObj = {
        to: (id) => ioObj,
        emit: (event, msg) => {},
      };
      const routes = new Routes();
      routes.setSocketInstance(ioObj);

      expect(routes.io).toStrictEqual(ioObj);
    });
  });

  describe('handler', () => {
    it('should choose default route when an unexistent rout is called', () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = 'inexistent';
      routes.handler(...params.values());

      expect(params.response.end).toHaveBeenCalledWith('Default route');
    });

    it('should set every request with CORS enabled', () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = 'inexistent';
      routes.handler(...params.values());

      expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    });

    it('should choose OPTIONS method when options is in the route', () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = 'OPTIONS';
      routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });

    it('should choose POST method when post is in the route', () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = 'POST';
      jest.spyOn(routes, routes.post.name).mockResolvedValue();

      routes.handler(...params.values());

      expect(routes.post).toHaveBeenCalled();
    });

    it('should choose GET method when get is in the route', () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = 'GET';
      jest.spyOn(routes, routes.get.name).mockResolvedValue();

      routes.handler(...params.values());

      expect(routes.get).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should list all downloaded files', async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      const fileStatusesMock = [
        {
          size: '78.9 kB',
          lastModified: '2021-09-06T20:21:02.380Z',
          owner: 'john.doe',
          file: 'file.png',
        },
      ];

      params.request.method = 'GET';
      jest.spyOn(routes.fileHelper, routes.fileHelper.getFilesStatus.name).mockResolvedValue(fileStatusesMock);

      await routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(fileStatusesMock));
    });
  });

  describe('post', () => {
    it('should validate post route workflow', async () => {
      const routes = new Routes('tmp');
      const options = {
        ...defaultParams,
      };

      options.request.method = 'POST';
      options.request.url = '?socketId=1';

      jest
        .spyOn(UploadHandler.prototype, UploadHandler.prototype.registerEvents.name)
        .mockImplementation((headers, onFinish) => {
          const writable = TestUtil.generateWritableStream(() => {});
          writable.on('finish', onFinish);

          return writable;
        });

      await routes.handler(...options.values());

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled();
      expect(options.response.writeHead).toHaveBeenCalledWith(200);

      const expectedEndMessage = JSON.stringify({ result: 'Files successfully uploaded' });
      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedEndMessage);
    });
  });
});
