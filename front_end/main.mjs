import { app, BrowserWindow, Menu } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ESM 中恢复 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8000;
let mainWindow;
let backendProcess;

const isDev = !app.isPackaged;
const backendName = process.platform === 'win32' ? 'server.exe' : 'server';
const backendPath = isDev
  ? path.join(__dirname, 'backend', backendName)
  : path.join(process.resourcesPath, backendName);

function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start < timeout) {
          setTimeout(check, 1000);
        } else {
          reject(new Error('Server startup timeout'));
        }
      });
      socket.connect(port, '127.0.0.1');
    }
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, 'dist-frontend', 'index.html');

  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load index.html:', err);
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend from:', backendPath);
    console.log('Path exists:', fs.existsSync(backendPath));

    if (!fs.existsSync(backendPath)) {
      return reject(new Error(`Backend executable not found at: ${backendPath}`));
    }

    backendProcess = spawn(backendPath, [], {
      cwd: path.dirname(backendPath),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let serverStarted = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Backend]', output);

      if (output.includes('Uvicorn running on') && !serverStarted) {
        serverStarted = true;
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('[Backend Error]', data.toString());
    });

    backendProcess.on('close', (code) => {
      console.log(`[Backend] exited with code ${code}`);
      if (!serverStarted) {
        reject(new Error(`Backend failed with code ${code}`));
      }
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    // 健康检查
    setTimeout(async () => {
      if (!serverStarted) {
        try {
          await waitForServer(PORT);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    }, 8000);
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
}

app.whenReady().then(async () => {
  try {
    console.log('Launching RNSH Desktop App...');
    await startBackend();
    console.log('✅ Backend started successfully');
    createWindow();
  } catch (err) {
    console.error('❌ Failed to start backend:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', stopBackend);

