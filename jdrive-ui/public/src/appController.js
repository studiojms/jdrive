class AppController {
  constructor(connectionManager, viewManager) {
    this.connectionManager = connectionManager;
    this.viewManager = viewManager;
  }

  async initialize() {
    this.viewManager.configureBtnNewFileClick();
    this.connectionManager.configureEvents(() => {});
    await this.updateCurrentFiles();
  }

  async updateCurrentFiles() {
    const files = await this.connectionManager.currentFiles();
    this.viewManager.updateCurrentFiles(files);
    console.log(files);
  }
}

export default AppController;
