import BusBoy from 'busboy';
import fs from 'fs';
import { pipeline } from 'stream/promises';

import { logger } from './logger.js';

class UploadHandler {
  constructor(io, socketId, downloadsFolder, messageTimeDelay = 100) {
    this.io = io;
    this.socketId = socketId;
    this.downloadsFolder = downloadsFolder;
    this.ON_UPLOAD_EVENT = 'file-upload';
    this.messageTimeDelay = messageTimeDelay;
  }

  canExecute(lastExecution) {
    return Date.now() - lastExecution >= this.messageTimeDelay;
  }

  handleFileBuffer(fileName) {
    this.lastSentMessage = Date.now();

    async function* handleData(source) {
      let alreadyProcessedBytes = 0;
      for await (const chunk of source) {
        yield chunk;
        alreadyProcessedBytes += chunk.length;

        if (!this.canExecute(this.lastSentMessage)) {
          continue;
        }

        this.lastSentMessage = Date.now();
        this.io.to(this.socketId).emit(this.ON_UPLOAD_EVENT, { alreadyProcessed: alreadyProcessedBytes, fileName });
        logger.info(`File [${fileName}] got ${alreadyProcessedBytes} bytes to ${this.socketId}`);
      }
    }

    return handleData.bind(this);
  }

  async onFile(fieldName, file, fileName) {
    const saveTo = `${this.downloadsFolder}/${fileName}`;
    await pipeline(
      file, //read
      this.handleFileBuffer(fileName), //transform
      fs.createWriteStream(saveTo) //write
    );
  }

  registerEvents(headers, onFinish) {
    const busBoy = new BusBoy({ headers });

    busBoy.on('file', this.onFile.bind(this));
    busBoy.on('finish', onFinish);

    return busBoy;
  }
}

export default UploadHandler;
