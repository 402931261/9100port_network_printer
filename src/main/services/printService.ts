import * as net from "net";
import axios from "axios";
import { Printer, PrintTask, PrintStatus, WebSocketResponse } from "../types";

export class PrintService {
  private printHistory: PrintTask[] = [];
  private onTaskUpdate: ((task: PrintTask) => void) | null = null;

  /** 注册任务变更回调（主进程用于推送渲染进程） */
  setOnTaskUpdate(callback: (task: PrintTask) => void): void {
    this.onTaskUpdate = callback;
  }

  getPrintHistory(printerId?: string): PrintTask[] {
    if (printerId) {
      return this.printHistory.filter((task) => task.printerId === printerId);
    }
    return this.printHistory;
  }

  async sendPrintTask(
    printer: Printer,
    urls: string[],
  ): Promise<WebSocketResponse> {
    const taskId = this.generateId();
    const task: PrintTask = {
      id: taskId,
      printerId: printer.id,
      urls,
      status: "sending",
      message: "正在发送",
      createTime: Date.now(),
    };

    this.printHistory.unshift(task);
    // 通知渲染进程：新任务创建
    if (this.onTaskUpdate) this.onTaskUpdate({ ...task });

    try {
      for (const url of urls) {
        const pdfData = await this.downloadPdf(url);
        await this.sendToPrinter(printer, pdfData);
      }

      this.updateTaskStatus(taskId, "success", "打印成功");
      return { code: 0, msg: "打印成功" };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "打印失败";
      this.updateTaskStatus(taskId, "failed", errorMsg);
      return { code: -1, msg: errorMsg };
    }
  }

  private async downloadPdf(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`下载PDF失败: ${url}`);
    }
  }

  private async sendToPrinter(printer: Printer, data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      // 连接超时 5 秒（与 Android 端一致）
      socket.setTimeout(5000);

      socket.on("connect", () => {
        // 1. 发送 PDF 原始字节流到打印机
        socket.write(data, () => {
          // 2. 刷新缓冲区（对应 Android 的 os.flush）
          socket.end(() => {
            // 3. 等待打印机处理数据（对应 Android 的 Thread.sleep(1000)）
            setTimeout(() => {
              resolve();
            }, 1500);
          });
        });
      });

      socket.on("timeout", () => {
        socket.destroy();
        reject(new Error("连接打印机超时"));
      });

      socket.on("error", (err) => {
        socket.destroy();
        reject(new Error(`发送失败: ${err.message}`));
      });

      socket.connect(printer.port, printer.ip);
    });
  }

  private updateTaskStatus(
    taskId: string,
    status: PrintStatus,
    message: string,
  ): void {
    const task = this.printHistory.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      task.message = message;
      task.completeTime = Date.now();
      // 通知渲染进程：任务状态变更
      if (this.onTaskUpdate) this.onTaskUpdate({ ...task });
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  clearPrintHistory(printerId?: string): void {
    if (printerId) {
      this.printHistory = this.printHistory.filter(
        (task) => task.printerId !== printerId,
      );
    } else {
      this.printHistory = [];
    }
  }

  deletePrintTask(taskId: string): void {
    this.printHistory = this.printHistory.filter((task) => task.id !== taskId);
  }
}
