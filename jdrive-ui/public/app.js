import AppController from './src/appController.js';
import ConnectionManager from './src/connectionManager.js';
import ViewManager from './src/viewManager.js';

const API_URL = 'https://localhost:3000';

const appController = new AppController(new ConnectionManager(API_URL), new ViewManager());

try {
  await appController.initialize();
} catch (err) {
  console.error(err.message);
}
