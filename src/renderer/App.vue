<template>
  <div class="app">
    <header class="app-header">
      <h1>9100端口打印中转程序</h1>
      <div class="header-info">
        <span class="ws-status">WebSocket: 13555</span>
      </div>
    </header>

    <PrinterTabs
      :printers="printers"
      :currentPrinterId="currentPrinterId"
      :isScanning="isScanning"
      v-model:scanSubnet="scanSubnet"
      @select="selectPrinter"
      @scan="scan"
    />

    <main class="app-main">
      <PrinterInfo
        v-if="currentPrinter"
        :printer="currentPrinter"
        @update-name="updatePrinterName"
        @set-default="setDefault"
        @check-status="checkStatus"
      />

      <PrintHistory
        :history="printHistory"
        @clear="clearHistory"
        @delete="deleteTask"
      />
    </main>

    <footer class="app-footer">
      <p>WebSocket 端口: 13555 | 打印机端口: 9100</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { usePrinter } from "./composables/usePrinter";
import PrinterTabs from "./components/PrinterTabs.vue";
import PrinterInfo from "./components/PrinterInfo.vue";
import PrintHistory from "./components/PrintHistory.vue";

const {
  printers,
  currentPrinterId,
  currentPrinter,
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
} = usePrinter();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  font-size: 14px;
  color: #333;
  background: #f5f5f5;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>

<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
    color: white;

    h1 {
      font-size: 18px;
      font-weight: 600;
    }

    .header-info {
      display: flex;
      gap: 16px;

      .ws-status {
        font-size: 12px;
        padding: 4px 10px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
      }
    }
  }

  .app-main {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  .app-footer {
    padding: 12px;
    text-align: center;
    background: #eee;
    font-size: 12px;
    color: #999;
  }
}
</style>
