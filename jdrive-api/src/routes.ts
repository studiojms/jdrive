import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { IncomingMessage, ServerResponse } from 'http';

import FileHelper from './fileHelper';
import { logger } from './logger';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDownloadsFolder = resolve(__dirname, '../', 'downloads');

class Routes {
  private downloadsFolder: string;
  private fileHelper: any;
  private io?: Server;

  constructor(downloadsFolder: string = defaultDownloadsFolder) {
    this.downloadsFolder = downloadsFolder;
    this.fileHelper = FileHelper;
  }

  setSocketInstance(io: Server) {
    this.io = io;
  }

  defaultRoute(request: IncomingMessage, response: ServerResponse) {
    response.end('Default route');
  }

  options(request: IncomingMessage, response: ServerResponse) {
    response.writeHead(204);
    response.end('options');
  }

  post(request: IncomingMessage, response: ServerResponse) {
    logger.info('POST');
    response.end();
  }

  async get(request: IncomingMessage, response: ServerResponse) {
    const files = await this.fileHelper.getFilesStatus(this.downloadsFolder);
    response.writeHead(200);
    response.end(JSON.stringify(files));
  }

  async handler(request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    if (request && request.method) {
      const method = (this as Record<string, any>)[request.method.toLowerCase()] || this.defaultRoute;

      return method.apply(this, [request, response]);
    }
  }
}

export default Routes;
