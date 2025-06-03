<template>
  <component
      :is="componentName"
      v-bind="normalProps"
      v-on="eventHandlers"
  >
    <template v-for="(child, index) in node.children || []" :key="index">
      <template v-if="typeof child === 'string'">
        {{ child }}
      </template>
      <template v-else>
        <JsonRenderer :node="child" />
      </template>
    </template>
  </component>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  node: Object
})

// ✅ 修正：确保定义了 componentName
const componentName = computed(() => props.node.type)

// ✅ 过滤掉 props 中的事件绑定（@click 等）
const normalProps = computed(() => {
  const result = {}
  for (const key in props.node.props) {
    if (!key.startsWith('@')) {
      result[key] = props.node.props[key]
    }
  }
  return result
})

// ✅ 提取事件绑定并转换为函数
const eventHandlers = computed(() => {
  const result = {}
  for (const key in props.node.props) {
    if (key.startsWith('@')) {
      const event = key.slice(1)
      try {
        result[event] = new Function(props.node.props[key])
      } catch (e) {
        console.warn(`Invalid handler for ${event}: ${props.node.props[key]}`)
      }
    }
  }
  return result
})
</script>