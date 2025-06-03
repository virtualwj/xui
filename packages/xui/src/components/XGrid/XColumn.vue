<!-- XColumn.vue -->
<template>
  <!-- 无任何真实 DOM 输出，仅占位传递 props 给父组件 -->
  <slot />
</template>

<script setup>
defineOptions({
  name: 'XColumn'
});

defineProps({
  // 你需要的列字段名，比如字段 key
  field: {
    type: String,
    required: true
  },
  // 列标题
  title: {
    type: String,
    required: true
  },
  // （可选）列宽度、对齐方式、插槽名称、格式化函数等
  width: {
    type: [String, Number],
    default: null
  },
  align: {
    type: String,
    default: 'left'
  },
  // 如果你想要给单元格自定义渲染插槽，比如 slot="cell"
  slotName: {
    type: String,
    default: null
  }
});
</script>