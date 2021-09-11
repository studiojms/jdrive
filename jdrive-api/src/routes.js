import { dirname, resolve } from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath, parse } from 'url';

import FileHelper from './fileHelper.js';
import { logger } from './logger.js';
import UploadHandler from './uploadHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads');

class Routes {
  io;

  constructor(downloadsFolder = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io) {
    this.io = io;
  }

  defaultRoute(request, response) {
    response.end('Default route');
  }

  options(request, response) {
    response.writeHead(204);
    response.end('options');
  }

  async post(request, response) {
    logger.info('POST');

    const { headers } = request;

    const {
      query: { socketId },
    } = parse(request.url, true);

    const uploadHandler = new UploadHandler(this.io, socketId, this.downloadsFolder);

    const onFinish = (response) => () => {
      response.writeHead(200);
      const data = JSON.stringify({ result: 'Files successfully uploaded' });
      response.end(data);
    };

    const busboy = uploadHandler.registerEvents(headers, onFinish(response));

    await pipeline(request, busboy);

    logger.info('Request finished successfully');
  }

  async get(request, response) {
    const files = await this.fileHelper.getFilesStatus(this.downloadsFolder);
    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    const method = this[request.method.toLowerCase()] || this.defaultRoute;

    return method.apply(this, [request, response]);
  }
}

export default Routes;
