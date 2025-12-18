import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';

import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

const isDev = !app.isPackaged;
const devServerUrl = process.env.CLIENT_DEV_SERVER_URL ?? 'http://localhost:3000';
const prodPort = process.env.PORT ?? '3000';

function startNextServer() {
  if (isDev || nextServer) return;

  const serverPath = path.join(process.resourcesPath, '.next', 'standalone', 'server.js');

  nextServer = fork(serverPath, {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: prodPort,
    },
    stdio: 'inherit',
  });
}

function stopNextServer() {
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
}

async function createWindow() {
  startNextServer();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = isDev ? devServerUrl : `http://localhost:${prodPort}`;
  await mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopNextServer();
    app.quit();
  }
});

app.on('before-quit', stopNextServer);

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
