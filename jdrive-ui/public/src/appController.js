class AppController {
  constructor(connectionManager, viewManager, dragNDropManager) {
    this.connectionManager = connectionManager;
    this.viewManager = viewManager;
    this.dragNDropManager = dragNDropManager;

    this.uploadingFiles = new Map();
  }

  async initialize() {
    this.viewManager.configureBtnNewFileClick();
    this.viewManager.configureOnFileChange(this.onFileChange.bind(this));
    this.viewManager.configureModal();

    this.dragNDropManager.initialize(this.onFileChange.bind(this));

    this.connectionManager.configureEvents(this.onProgress.bind(this));

    this.viewManager.updateProgress(0);
    await this.updateCurrentFiles();
  }

  onProgress({ alreadyProcessed, fileName }) {
    const file = this.uploadingFiles.get(fileName);
    const percentProcessed = Math.ceil((alreadyProcessed / file.size) * 100);

    this.updateProgress(file, percentProcessed);

    if (percentProcessed > 98) {
      return this.updateCurrentFiles();
    }
  }

  updateProgress(file, progress) {
    const uploadedFiles = this.uploadingFiles;
    file.percent = progress;

    const total = [...uploadedFiles.values()].map(({ percent }) => percent ?? 0).reduce((acum, curr) => acum + curr, 0);

    this.viewManager.updateProgress(total);
  }

  async onFileChange(files) {
    this.uploadingFiles.clear();
    this.viewManager.openModal();
    this.viewManager.updateProgress(0);

    const requests = [];

    for (const file of files) {
      this.uploadingFiles.set(file.name, file);
      requests.push(this.connectionManager.uploadFile(file));
    }

    await Promise.all(requests);
    this.viewManager.updateProgress(100);
    this.uploadingFiles.clear();

    setTimeout(() => this.viewManager.closeModal(), 1000);

    this.updateCurrentFiles();
  }

  async updateCurrentFiles() {
    const files = await this.connectionManager.currentFiles();
    this.viewManager.updateCurrentFiles(files);
    console.log(files);
  }
}

export default AppController;
