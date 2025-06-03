<template>
  <div class="ef-region">
    <!-- 顶部标题栏 -->
    <div class="ef-region__header">
      <span class="ef-region__title">{{ title }}</span>
      <div class="ef-region__tools">
        <slot name="tools" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="ef-region__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String
})
</script>

<style scoped>
.ef-region {
  border: 1px solid #dfe6ec;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
  font-family: sans-serif;
}

.ef-region__header {
  background-color: #e6f0fb;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
}

.ef-region__title {
  flex: 1;
}

.ef-region__tools {
  display: flex;
  gap: 8px;
}

.ef-region__body {
  padding: 16px;
  background-color: white;
}
</style>