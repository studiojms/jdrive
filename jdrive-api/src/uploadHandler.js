import BusBoy from 'busboy';

class UploadHandler {
  constructor(io, socketId) {}

  onFile(fieldName, file, fileName) {}

  registerEvents(headers, onFinish) {
    const busBoy = new BusBoy({ headers });

    busBoy.on('file', this.onFile.bind(this));
    busBoy.on('finish', onFinish);

    return busBoy;
  }
}

export default UploadHandler;
