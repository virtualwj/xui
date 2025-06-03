<template>
  <div class="dynamic-vue-renderer">
    <component
        :is="dynamicComponent"
    />
  </div>
</template>

<script setup>
import { computed, defineProps, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import * as Vue from 'vue'
import { loadModule } from 'vue3-sfc-loader'

const props = defineProps({
  template: String
})

const dynamicComponent = ref(null)


/**
 * 处理Vue3组件代码，确保HTML代码被正确的template标签包裹
 * @param {string} code - 原始Vue代码或HTML代码
 * @returns {string} - 修改后的Vue组件代码
 */
function processTemplate(code) {
  // 去除首尾空白字符
  const trimmedCode = code.trim();

  // 如果是空字符串，返回基本的Vue模板
  if (!trimmedCode) {
    return `<template>
  <div></div>
</template>`;
  }

  // 检查是否已经是完整的Vue组件（包含template、script或style标签）
  const hasVueStructure = /<(template|script|style)[\s>]/i.test(trimmedCode);

  if (hasVueStructure) {
    // 已经是完整的Vue组件，检查是否有template
    const hasTemplate = /<template[\s>]/i.test(trimmedCode);

    if (hasTemplate) {
      // 已经有template，直接返回
      return trimmedCode;
    } else {
      // 有Vue结构但没有template，需要添加一个空的template
      return `<template>
  <div></div>
</template>

${trimmedCode}`;
    }
  }

  // 纯HTML代码，需要用template包裹
  // 检查是否以HTML标签开始
  const isHtmlLike = /^\s*<[a-zA-Z]/.test(trimmedCode);

  if (isHtmlLike) {
    // 检查是否有多个根元素（Vue3允许多个根元素）
    const lines = trimmedCode.split('\n');
    const indentedCode = lines.map(line => {
      // 如果行不为空且不是纯空白，添加2个空格缩进
      return line.trim() ? '  ' + line : line;
    }).join('\n');

    return `<template>
${indentedCode}
</template>`;
  }

  // 不是HTML标签开始的内容，可能是纯文本，包装在div中
  return `<template>
  <div>${trimmedCode}</div>
</template>`;
}

// 创建加载选项
const createOptions = () => {
  return {
    moduleCache: {
      vue: Vue,
    },

    async getFile(url) {
      if (url === './component.vue') {
        console.log('返回模板内容')
        // 处理模板内容
        const processedTemplate = processTemplate(props.template)
        console.log('处理后的模板:', processedTemplate)
        return processedTemplate
      }
    },

    addStyle(textContent) {
      const style = document.createElement('style')
      style.textContent = textContent
      document.head.appendChild(style)
    }
  }
}

// 加载动态组件
const loadDynamicComponent = async () => {
  try {
    const options = createOptions()
    const component = await loadModule('./component.vue', options)
    console.log('组件加载成功:', component)
    dynamicComponent.value = component
  } catch (error) {
    console.error('组件加载失败:', error)
    // 可以在这里设置错误状态
    dynamicComponent.value = {
      template: `<div class="error">
        <h4>组件加载失败</h4>
        <pre>{{ error }}</pre>
      </div>`,
      data() {
        return { error: error.message }
      }
    }
  }
}

watch(() => props.template, async (newValue, oldValue) => {
  console.log('模板变化', newValue, oldValue)
  await loadDynamicComponent()
})

// 组件挂载时初始化
onMounted(async () => {
  console.log('DynamicVueRenderer 挂载')
  await loadDynamicComponent()
})
</script>

<style scoped>
.dynamic-vue-renderer {
  width: 100%;
  min-height: 50px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #666;
  font-size: 14px;
}

.error {
  padding: 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  margin: 10px 0;
}

.error h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.error pre {
  margin: 8px 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.retry-btn:hover {
  background-color: #b91c1c;
}

.no-template {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>