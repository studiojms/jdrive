class ConnectionManager {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.ioClient = io.connect(apiUrl, { withCredentials: false });
    this.socketId = '';
  }

  configureEvents(onProgress) {
    const FILE_UPLOAD_EVENT = 'file-upload';
    this.ioClient.on('connect', this.onConnect.bind(this));
    this.ioClient.on(FILE_UPLOAD_EVENT, onProgress);
  }

  onConnect(msg) {
    this.socketId = this.ioClient.id;
    console.log('connected', this.socketId);
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('files', file);

    const response = await fetch(`${this.apiUrl}?socketId=${this.socketId}`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  async currentFiles() {
    try {
      const resp = await fetch(this.apiUrl);
      return await resp.json();
    } catch (err) {
      console.error(err.message);
    }
  }
}

export default ConnectionManager;
