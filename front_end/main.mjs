import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// === 路径初始化（ESM 版本） ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === 配置 ===
const PORT = 8000;
const isDev = !app.isPackaged;
const backendName = process.platform === 'win32' ? 'server/server.exe' : 'server/server';
const backendPath = isDev
  ? path.join(__dirname, 'dist-backend', backendName)
  : path.join(process.resourcesPath, backendName);

let mainWindow = null;
let backendProcess = null;

// === 启动后端 ===
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

    // 健康检查 fallback
    setTimeout(async () => {
      if (!serverStarted) {
        try {
          await waitForServer(PORT);
          serverStarted = true;
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    }, 8000);
  });
}

// === 等待服务可用 ===
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

// === 创建窗口 ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Scopix',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allow file downloads
      allowRunningInsecureContent: true, // Allow downloads
    },
    show: false,
    // Enable auto-hide scrollbars
    autoHideMenuBar: true,
  });

  // Handle file downloads
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    const savePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(savePath);
    
    item.on('updated', (event, state) => {
      if (state === 'interrupted') {
        console.log('Download is interrupted but can be resumed');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('Download is paused');
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    });
    
    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Download successfully');
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });

  // Enable auto-hide scrollbars
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.insertCSS(`
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      
      ::-webkit-scrollbar-thumb {
        background: transparent;
        border-radius: 4px;
        transition: background-color 0.3s ease;
      }
      
      /* Show scrollbar on hover */
      *:hover::-webkit-scrollbar-thumb {
        background: #565a6e;
        transition: background-color 0.2s ease 0.1s;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: #34548a;
        transition: background-color 0.1s ease;
      }
      
      /* Dark mode scrollbar */
      .dark ::-webkit-scrollbar-thumb {
        background: transparent;
      }
      
      .dark *:hover::-webkit-scrollbar-thumb {
        background: #c0caf5;
        transition: background-color 0.2s ease 0.1s;
      }
      
      .dark ::-webkit-scrollbar-thumb:hover {
        background: #7aa2f7;
        transition: background-color 0.1s ease;
      }
    `);
  });

  // IPC handlers for file downloads
  ipcMain.handle('download-file', async (event, url, filename) => {
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const downloadsPath = app.getPath('downloads');
      const filePath = path.join(downloadsPath, filename);
      
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Download failed:', error);
      return { success: false, error: error.message };
    }
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, 'dist-frontend', 'index.html');

  mainWindow.loadFile(indexPath).catch((err) => {
    console.error('Failed to load frontend:', err);
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

// === 停止后端 ===
function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    console.log('Stopping backend process...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// === 单实例检查 ===
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance is already running');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // === 应用生命周期 ===
  app.whenReady().then(async () => {
    try {
      console.log('Launching RNSH Desktop App...');
      await startBackend();
      console.log('Backend started successfully');
      createWindow();
    } catch (err) {
      console.error('Failed to start backend:', err);
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  console.log('All windows closed.');
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  console.log('App is quitting...');
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// === 崩溃防御：异常退出也关闭后端 ===
process.on('exit', stopBackend);
process.on('SIGINT', stopBackend);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  stopBackend();
  process.exit(1);
});