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
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 5173;
const isDev = !app.isPackaged;

// Backend paths for development vs production
const backendPath = isDev
  ? path.join(__dirname, '..', 'back_end')  // Development: use source directory
  : path.join(process.resourcesPath, 'server', 'server');  // Production: use compiled executable

// Frontend paths
const frontendPath = isDev
  ? __dirname  // Development: use current directory
  : path.join(__dirname, 'dist-frontend');  // Production: use built files

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

// === 启动后端 ===
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('Starting backend from:', backendPath);
    console.log('Development mode:', isDev);

    if (isDev) {
      // Development mode: use uv to run the FastAPI server
      console.log('Starting development server with uv...');
      
      backendProcess = spawn('uv', ['run', 'fastapi', 'dev'], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONPATH: backendPath
        }
      });
    } else {
      // Production mode: use compiled executable
      if (!fs.existsSync(backendPath)) {
        return reject(new Error(`Backend executable not found at: ${backendPath}`));
      }

      backendProcess = spawn(backendPath, [], {
        cwd: path.dirname(backendPath),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }

    let serverStarted = false;

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Backend]', output);

      // Check for different startup messages
      if ((output.includes('Uvicorn running on') || output.includes('Application startup complete')) && !serverStarted) {
        serverStarted = true;
        console.log('Backend server started successfully');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('[Backend Error]', error);
      
      // Don't treat stderr as fatal in development mode
      if (isDev && error.includes('INFO:') || error.includes('WARNING:')) {
        console.log('[Backend Info]', error);
      }
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
          await waitForServer(BACKEND_PORT);
          serverStarted = true;
          console.log('Backend server confirmed running via health check');
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    }, 10000); // Increased timeout for development server
  });
}

// === 启动前端开发服务器 ===
function startFrontend() {
  return new Promise((resolve, reject) => {
    if (!isDev) {
      // In production, we load the built files directly
      console.log('Production mode: loading built frontend files');
      resolve();
      return;
    }

    console.log('Starting frontend development server...');
    console.log('Frontend path:', frontendPath);

    // Start Vite development server
    frontendProcess = spawn('pnpm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: FRONTEND_PORT.toString()
      }
    });

    let serverStarted = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Frontend]', output);

      // Check for Vite startup messages
      if ((output.includes('Local:') || output.includes('Network:') || output.includes('ready in')) && !serverStarted) {
        serverStarted = true;
        console.log('Frontend development server started successfully');
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('[Frontend Error]', error);
      
      // Don't treat stderr as fatal in development mode
      if (isDev && (error.includes('WARN') || error.includes('INFO'))) {
        console.log('[Frontend Info]', error);
      }
    });

    frontendProcess.on('close', (code) => {
      console.log(`[Frontend] exited with code ${code}`);
      if (!serverStarted) {
        reject(new Error(`Frontend failed with code ${code}`));
      }
    });

    frontendProcess.on('error', (err) => {
      console.error('Failed to start frontend:', err);
      reject(err);
    });

    // Health check fallback for frontend
    setTimeout(async () => {
      if (!serverStarted) {
        try {
          await waitForServer(FRONTEND_PORT);
          serverStarted = true;
          console.log('Frontend server confirmed running via health check');
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
      webSecurity: false, // Allow local file access
      allowRunningInsecureContent: true, // Allow localhost connections
    },
    show: false,
  });

  Menu.setApplicationMenu(null);

  // Load the appropriate URL based on development vs production
  if (isDev) {
    // Development: load from Vite dev server
    const devUrl = `http://localhost:${FRONTEND_PORT}`;
    console.log('Loading frontend from development server:', devUrl);
    mainWindow.loadURL(devUrl).catch((err) => {
      console.error('Failed to load frontend from dev server:', err);
    });
  } else {
    // Production: load from built files
    const indexPath = path.join(__dirname, 'dist-frontend', 'index.html');
    console.log('Loading frontend from built files:', indexPath);
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error('Failed to load frontend from built files:', err);
    });
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle file downloads
  mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
    // Don't set a save path - let Electron show the save dialog
    console.log(`Download started: ${item.getFilename()}`);
    
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
        console.log('Download completed successfully');
        // Notify the renderer process that download is complete
        webContents.send('download-complete', { success: true, filePath: item.getSavePath() });
      } else {
        console.log(`Download failed: ${state}`);
        webContents.send('download-complete', { success: false, error: state });
      }
    });
  });
}

// === IPC Handlers for secure file downloads ===
ipcMain.handle('download-file', async (event, { url, filename, method = 'GET', body = null, headers = {} }) => {
  try {
    console.log(`Downloading file from: ${url} with method: ${method}`);
    
    // Prepare fetch options
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add body for POST requests
    if (method === 'POST' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Fetch the file from the backend
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // Show save dialog instead of automatically saving
    const { dialog } = await import('electron');
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'ZIP Files', extensions: ['zip'] },
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    
    if (filePath) {
      // Write the file to the user-selected path
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`File saved to: ${filePath}`);
      return { success: true, filePath };
    } else {
      // User cancelled the save dialog
      console.log('Download cancelled by user');
      return { success: false, error: 'Download cancelled by user' };
    }
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
});

// === 停止服务 ===
function stopServices() {
  console.log('Stopping all services...');
  
  if (backendProcess && !backendProcess.killed) {
    console.log('Stopping backend process...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  
  if (frontendProcess && !frontendProcess.killed) {
    console.log('Stopping frontend process...');
    frontendProcess.kill('SIGTERM');
    frontendProcess = null;
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
      
      // Start backend first
      await startBackend();
      console.log('Backend started successfully');
      
      // Start frontend development server
      await startFrontend();
      console.log('Frontend started successfully');
      
      // Create window after both services are ready
      createWindow();
    } catch (err) {
      console.error('Failed to start services:', err);
      app.quit();
    }
  });
}

app.on('window-all-closed', () => {
  console.log('All windows closed.');
  stopServices();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  console.log('App is quitting...');
  stopServices();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// === 崩溃防御：异常退出也关闭服务 ===
process.on('exit', stopServices);
process.on('SIGINT', stopServices);
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  stopServices();
  process.exit(1);
});
