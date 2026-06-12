import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import { Printer, PrintTask } from "./types";
import { PrinterScanner } from "./services/printerScanner";
import { PrintService } from "./services/printService";
import { WebSocketServer } from "./services/webSocketServer";
import {
  savePrinters,
  loadPrinters,
  saveDefaultPrinterId,
  loadDefaultPrinterId,
} from "./utils/storage";

let mainWindow: BrowserWindow | null = null;
const printerScanner = new PrinterScanner();
const printService = new PrintService();
const webSocketServer = new WebSocketServer();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "打印中转程序",
  });

  if (process.env.NODE_ENV === "development") {
    const vitePort = process.env.VITE_PORT || "5173";
    mainWindow.loadURL(`http://localhost:${vitePort}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function initIpcHandlers(): void {
  ipcMain.handle("scan-printers", async (_event, subnet?: string) => {
    try {
      const printers = await printerScanner.scanPrinters(subnet);
      savePrinters(printers);
      return { success: true, data: printers };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "扫描失败",
      };
    }
  });

  ipcMain.handle("load-printers", async () => {
    const printers = loadPrinters();
    const defaultId = loadDefaultPrinterId();
    return {
      printers: printers.map((p) => ({ ...p, isDefault: p.id === defaultId })),
      defaultPrinterId: defaultId,
    };
  });

  ipcMain.handle("set-default-printer", async (_event, printerId: string) => {
    try {
      saveDefaultPrinterId(printerId);
      const printers = loadPrinters();
      const printer = printers.find((p) => p.id === printerId);
      if (printer) {
        webSocketServer.setDefaultPrinter(printer);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "设置失败",
      };
    }
  });

  ipcMain.handle("update-printer-name", async (_event, printer: Printer) => {
    try {
      const info = await printerScanner.updatePrinterInfo(printer);
      const printers = loadPrinters();
      const index = printers.findIndex((p) => p.id === printer.id);
      if (index !== -1) {
        printers[index].name = info.name;
        printers[index].model = info.model;
        savePrinters(printers);
      }
      return { success: true, ...info };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "更新失败",
      };
    }
  });

  ipcMain.handle("check-printer-status", async (_event, printer: Printer) => {
    try {
      const status = await printerScanner.checkPrinterStatus(printer);
      return { success: true, status };
    } catch (error) {
      return { success: false, status: "offline" };
    }
  });

  ipcMain.handle("get-print-history", async (_event, printerId?: string) => {
    return printService.getPrintHistory(printerId);
  });

  ipcMain.handle("clear-print-history", async (_event, printerId?: string) => {
    printService.clearPrintHistory(printerId);
    return { success: true };
  });

  ipcMain.handle("delete-print-task", async (_event, taskId: string) => {
    printService.deletePrintTask(taskId);
    return { success: true };
  });
}

/** 注册打印任务变更通知，实时推送到渲染进程 */
function initPrintTaskNotification(): void {
  printService.setOnTaskUpdate((task: PrintTask) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("print-task-updated", task);
    }
  });
}

function initWebSocketServer(): void {
  webSocketServer.setOnPrintRequestHandler(async (urls) => {
    const defaultId = loadDefaultPrinterId();
    const printers = loadPrinters();
    const printer = printers.find((p) => p.id === defaultId);

    if (!printer) {
      return { code: -1, msg: "未设置默认打印机" };
    }

    return printService.sendPrintTask(printer, urls);
  });

  webSocketServer.start(13555);

  const defaultId = loadDefaultPrinterId();
  if (defaultId) {
    const printers = loadPrinters();
    const printer = printers.find((p) => p.id === defaultId);
    if (printer) {
      webSocketServer.setDefaultPrinter(printer);
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  initIpcHandlers();
  initPrintTaskNotification();
  initWebSocketServer();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  webSocketServer.stop();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

process.on("uncaughtException", (error) => {
  dialog.showErrorBox("错误", error.message);
});
