<template>
  <div class="print-history">
    <div class="history-header">
      <h3>打印历史</h3>
      <button class="clear-btn" @click="$emit('clear')" v-if="history.length > 0">
        清空记录
      </button>
    </div>
    
    <div v-if="history.length === 0" class="empty-state">
      <p>暂无打印记录</p>
      <p class="hint">WebSocket 打印任务将显示在这里</p>
    </div>
    
    <div v-else class="history-list">
      <div v-for="task in history" :key="task.id" class="history-item">
        <div class="item-header">
          <span :class="['status-badge', task.status]">
            {{ task.status === 'sending' ? '发送中' : task.status === 'success' ? '成功' : '失败' }}
          </span>
          <span class="time">{{ formatTime(task.createTime) }}</span>
          <button class="delete-btn" @click="$emit('delete', task.id)">删除</button>
        </div>
        <div class="item-urls">
          <div v-for="(url, index) in task.urls" :key="index" class="url-item">
            {{ url }}
          </div>
        </div>
        <div class="item-message">
          {{ task.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PrintTask } from '../types'
import { formatTime } from '../utils/format'

defineProps<{
  history: PrintTask[]
}>()

defineEmits<{
  clear: []
  delete: [taskId: string]
}>()
</script>

<style scoped>
.print-history {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.clear-btn {
  padding: 6px 12px;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  background: white;
  color: #f56c6c;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #fef0f0;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #999;
}

.empty-state p {
  margin: 8px 0;
}

.empty-state .hint {
  font-size: 12px;
}

.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.status-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-badge.sending {
  background: #fff7e6;
  color: #e6a23c;
}

.status-badge.success {
  background: #f0f9eb;
  color: #67c23a;
}

.status-badge.failed {
  background: #fef0f0;
  color: #f56c6c;
}

.time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  margin-left: auto;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #f56c6c;
}

.item-urls {
  margin-bottom: 8px;
}

.url-item {
  font-size: 13px;
  color: #666;
  word-break: break-all;
  padding: 4px 0;
}

.item-message {
  font-size: 12px;
  color: #999;
}
</style>