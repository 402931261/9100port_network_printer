/// <reference types="vite/client" />

declare interface Window {
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

interface Printer {
  id: string;
  ip: string;
  port: number;
  name: string;
  model: string;
  isDefault: boolean;
  status: "online" | "offline" | "unknown";
}

interface PrintTask {
  id: string;
  printerId: string;
  urls: string[];
  status: "sending" | "success" | "failed";
  message: string;
  createTime: number;
  completeTime?: number;
}
