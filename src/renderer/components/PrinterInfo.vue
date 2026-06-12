<template>
  <div class="printer-info" v-if="printer">
    <div class="info-header">
      <h2>{{ printer.name }}</h2>
      <div class="info-actions">
        <!-- <button class="action-btn" @click="$emit('update-name', printer)">
          刷新名称
        </button> -->
        <button
          :class="['action-btn', { primary: !printer.isDefault }]"
          @click="$emit('set-default', printer.id)"
        >
          {{ printer.isDefault ? "已设为默认" : "设为默认" }}
        </button>
        <!-- <button class="action-btn" @click="$emit('check-status', printer)">
          检查状态
        </button> -->
      </div>
    </div>
    <div class="info-detail">
      <div class="detail-row">
        <span class="label">IP地址:</span>
        <span class="value">{{ printer.ip }}</span>
      </div>
      <div class="detail-row">
        <span class="label">端口:</span>
        <span class="value">{{ printer.port }}</span>
      </div>
      <div
        class="detail-row"
        v-if="printer.model && printer.model !== '未知型号'"
      >
        <span class="label">型号:</span>
        <span class="value">{{ printer.model }}</span>
      </div>
      <div class="detail-row">
        <span class="label">状态:</span>
        <span :class="['value', 'status-text', printer.status]">
          {{
            printer.status === "online"
              ? "在线"
              : printer.status === "offline"
                ? "离线"
                : "未知"
          }}
        </span>
      </div>
    </div>
  </div>

  <!-- 无打印机时的空状态提示 -->
  <div v-else class="empty-printer">
    <p class="empty-text">暂未扫描到打印机</p>
    <p class="empty-hint">请点击"重新扫描"按钮搜索局域网内的打印机</p>
  </div>
</template>

<script setup lang="ts">
import type { Printer } from "../types";

defineProps<{
  printer: Printer | null;
}>();

defineEmits<{
  "update-name": [printer: Printer];
  "set-default": [printerId: string];
  "check-status": [printer: Printer];
}>();
</script>

<style scoped>
.printer-info {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.info-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.action-btn.primary {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.action-btn.primary:hover {
  background: #66b1ff;
}

.info-detail {
  display: flex;
  gap: 24px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #999;
}

.value {
  font-size: 14px;
  color: #333;
}

.status-text.online {
  color: #67c23a;
}

.status-text.offline {
  color: #f56c6c;
}

.status-text.unknown {
  color: #909399;
}

.empty-printer {
  padding: 40px 16px;
  text-align: center;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 12px;
  color: #ccc;
  margin: 0;
}
</style>
