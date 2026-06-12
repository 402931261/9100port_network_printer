import { ref, onMounted, onUnmounted } from "vue";
import type { Printer, PrintTask } from "../types";

export function usePrinter() {
  const printers = ref<Printer[]>([]);
  const currentPrinterId = ref<string | null>(null);
  const defaultPrinterId = ref<string | null>(null);
  const isScanning = ref(false);
  const scanSubnet = ref("");

  const currentPrinter = ref<Printer | null>(null);

  const printHistory = ref<PrintTask[]>([]);

  onMounted(async () => {
    await loadPrinters();
    // 监听打印任务实时更新
    window.electronAPI.onPrintTaskUpdated((task: PrintTask) => {
      // 如果任务属于当前选中的打印机，直接更新列表
      if (task.printerId === currentPrinterId.value) {
        const index = printHistory.value.findIndex((t) => t.id === task.id);
        if (index !== -1) {
          // 已存在 → 更新状态
          printHistory.value[index] = task;
        } else {
          // 新任务 → 插入到头部
          printHistory.value.unshift(task);
        }
      }
    });
  });

  onUnmounted(() => {
    window.electronAPI.removePrintTaskListener();
  });

  async function loadPrinters() {
    const result = await window.electronAPI.loadPrinters();
    printers.value = result.printers;
    defaultPrinterId.value = result.defaultPrinterId;

    if (printers.value.length > 0) {
      currentPrinterId.value = printers.value[0].id;
      currentPrinter.value = printers.value[0];
      await loadPrintHistory();
    }
  }

  async function scan(subnet?: string) {
    isScanning.value = true;
    const result = await window.electronAPI.scanPrinters(subnet);
    isScanning.value = false;

    if (result.success && result.data) {
      printers.value = result.data.map((p: Printer) => ({
        ...p,
        isDefault: p.id === defaultPrinterId.value,
      }));

      if (printers.value.length > 0) {
        // 有打印机：选中第一个
        currentPrinterId.value = printers.value[0].id;
        currentPrinter.value = printers.value[0];
        await loadPrintHistory();
      } else {
        // 扫描不到打印机：清空当前选中
        currentPrinterId.value = null;
        currentPrinter.value = null;
        printHistory.value = [];
      }
    }
  }

  async function setDefault(printerId: string) {
    const result = await window.electronAPI.setDefaultPrinter(printerId);
    if (result.success) {
      defaultPrinterId.value = printerId;
      printers.value = printers.value.map((p) => ({
        ...p,
        isDefault: p.id === printerId,
      }));
    }
  }

  async function updatePrinterName(printer: Printer) {
    const result = await window.electronAPI.updatePrinterName(printer);
    if (result.success && result.name) {
      const index = printers.value.findIndex((p) => p.id === printer.id);
      if (index !== -1) {
        printers.value[index].name = result.name;
        if (result.model) {
          printers.value[index].model = result.model;
        }
        if (currentPrinter.value?.id === printer.id) {
          currentPrinter.value.name = result.name;
          if (result.model) {
            currentPrinter.value.model = result.model;
          }
        }
      }
    }
  }

  async function checkStatus(printer: Printer) {
    const result = await window.electronAPI.checkPrinterStatus(printer);
    if (result.success) {
      const index = printers.value.findIndex((p) => p.id === printer.id);
      if (index !== -1) {
        printers.value[index].status = result.status;
        if (currentPrinter.value?.id === printer.id) {
          currentPrinter.value.status = result.status;
        }
      }
    }
  }

  async function loadPrintHistory() {
    if (currentPrinterId.value) {
      printHistory.value = await window.electronAPI.getPrintHistory(
        currentPrinterId.value,
      );
    }
  }

  async function clearHistory(printerId?: string) {
    await window.electronAPI.clearPrintHistory(printerId);
    await loadPrintHistory();
  }

  async function deleteTask(taskId: string) {
    await window.electronAPI.deletePrintTask(taskId);
    await loadPrintHistory();
  }

  function selectPrinter(printer: Printer) {
    currentPrinterId.value = printer.id;
    currentPrinter.value = printer;
    loadPrintHistory();
  }

  return {
    printers,
    currentPrinterId,
    currentPrinter,
    defaultPrinterId,
    isScanning,
    scanSubnet,
    printHistory,
    scan,
    setDefault,
    updatePrinterName,
    checkStatus,
    clearHistory,
    deleteTask,
    selectPrinter,
  };
}
