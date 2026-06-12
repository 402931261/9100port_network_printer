export interface Printer {
  id: string;
  ip: string;
  port: number;
  name: string;
  model: string;
  isDefault: boolean;
  status: "online" | "offline" | "unknown";
}

export type PrintStatus = "sending" | "success" | "failed";

export interface PrintTask {
  id: string;
  printerId: string;
  urls: string[];
  status: PrintStatus;
  message: string;
  createTime: number;
  completeTime?: number;
}

export interface WebSocketRequest {
  printUrl: string[];
}

export interface WebSocketResponse {
  code: number;
  msg: string;
}

export interface ScanResult {
  ip: string;
  port: number;
  isOpen: boolean;
}

export interface AppState {
  printers: Printer[];
  printHistory: PrintTask[];
  defaultPrinterId: string | null;
}
