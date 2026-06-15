<template>
  <div class="printer-tabs">
    <div class="tabs-header">
      <button
        v-for="printer in printers"
        :key="printer.id"
        :class="['tab-btn', { active: currentPrinterId === printer.id }]"
        @click="$emit('select', printer)"
      >
        <span class="printer-name">{{ printer.name }}</span>
        <span :class="['status-dot', printer.status]"></span>
        <span v-if="printer.isDefault" class="default-badge">默认</span>
      </button>
    </div>
    <div class="tabs-actions">
      <input
        :value="localSubnet"
        type="text"
        placeholder="输入网段(如192.168.1)"
        class="subnet-input"
        @input="handleSubnetInput"
      />
      <button :disabled="isScanning" class="scan-btn" @click="handleScan">
        <span v-if="isScanning">扫描中...</span>
        <span v-else>重新扫描</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Printer } from "../types";

const props = defineProps<{
  printers: Printer[];
  currentPrinterId: string | null;
  isScanning: boolean;
  scanSubnet: string;
}>();

const emit = defineEmits<{
  select: [printer: Printer];
  scan: [subnet?: string];
  "update:scanSubnet": [value: string];
}>();

const localSubnet = ref(props.scanSubnet);

watch(
  () => props.scanSubnet,
  (newVal) => {
    localSubnet.value = newVal;
  },
);

function handleSubnetInput(event: Event) {
  const target = event.target as HTMLInputElement;
  localSubnet.value = target.value;
  emit("update:scanSubnet", target.value);
}

function handleScan() {
  emit("scan", localSubnet.value || undefined);
}
</script>

<style lang="scss" scoped>
.printer-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 16px;

  .tabs-header {
    display: flex;
    gap: 8px;
    overflow-x: auto;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #409eff;
    }

    &.active {
      background: #409eff;
      border-color: #409eff;
      color: white;

      .status-dot.online {
        background: #a8e063;
      }
      .status-dot.offline {
        background: #ff8888;
      }
      .default-badge {
        background: #a8e063;
      }
    }

    .printer-name {
      font-size: 14px;
      white-space: nowrap;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.online {
        background: #67c23a;
      }
      &.offline {
        background: #f56c6c;
      }
      &.unknown {
        background: #909399;
      }
    }

    .default-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #67c23a;
      color: white;
      flex-shrink: 0;
    }
  }

  .tabs-actions {
    display: flex;
    gap: 8px;

    .subnet-input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      width: 180px;
    }

    .scan-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      background: #409eff;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;

      &:hover:not(:disabled) {
        background: #66b1ff;
      }
      &:disabled {
        background: #a0cfff;
        cursor: not-allowed;
      }
    }
  }
}
</style>
