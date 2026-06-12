import { contextBridge, ipcRenderer } from "electron";
import { Printer, PrintTask } from "./types";

contextBridge.exposeInMainWorld("electronAPI", {
  scanPrinters: (subnet?: string) =>
    ipcRenderer.invoke("scan-printers", subnet),
  loadPrinters: () => ipcRenderer.invoke("load-printers"),
  setDefaultPrinter: (printerId: string) =>
    ipcRenderer.invoke("set-default-printer", printerId),
  updatePrinterName: (printer: Printer) =>
    ipcRenderer.invoke("update-printer-name", printer),
  checkPrinterStatus: (printer: Printer) =>
    ipcRenderer.invoke("check-printer-status", printer),
  getPrintHistory: (printerId?: string) =>
    ipcRenderer.invoke("get-print-history", printerId),
  clearPrintHistory: (printerId?: string) =>
    ipcRenderer.invoke("clear-print-history", printerId),
  deletePrintTask: (taskId: string) =>
    ipcRenderer.invoke("delete-print-task", taskId),
  // 打印任务实时更新事件监听
  onPrintTaskUpdated: (callback: (task: PrintTask) => void) => {
    ipcRenderer.on("print-task-updated", (_event, task) => callback(task));
  },
  removePrintTaskListener: () => {
    ipcRenderer.removeAllListeners("print-task-updated");
  },
});

declare global {
  interface Window {
    electronAPI: {
      scanPrinters: (
        subnet?: string,
      ) => Promise<{ success: boolean; data?: Printer[]; message?: string }>;
      loadPrinters: () => Promise<{
        printers: Printer[];
        defaultPrinterId: string | null;
      }>;
      setDefaultPrinter: (
        printerId: string,
      ) => Promise<{ success: boolean; message?: string }>;
      updatePrinterName: (
        printer: Printer,
      ) => Promise<{
        success: boolean;
        name?: string;
        model?: string;
        message?: string;
      }>;
      checkPrinterStatus: (
        printer: Printer,
      ) => Promise<{ success: boolean; status: "online" | "offline" }>;
      getPrintHistory: (printerId?: string) => Promise<PrintTask[]>;
      clearPrintHistory: (printerId?: string) => Promise<{ success: boolean }>;
      deletePrintTask: (taskId: string) => Promise<{ success: boolean }>;
      onPrintTaskUpdated: (callback: (task: PrintTask) => void) => void;
      removePrintTaskListener: () => void;
    };
  }
}
