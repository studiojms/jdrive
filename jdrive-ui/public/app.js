import AppController from './src/appController.js';
import ConnectionManager from './src/connectionManager.js';
import DragNDropManager from './src/dragNDropManager.js';
import ViewManager from './src/viewManager.js';

const API_URL = 'https://localhost:3000';

const appController = new AppController(new ConnectionManager(API_URL), new ViewManager(), new DragNDropManager());

try {
  await appController.initialize();
} catch (err) {
  console.error(err.message);
}
