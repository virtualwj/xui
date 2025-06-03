<template>
  <div class="vue-code-editor">
    <div class="header" v-if="showHeader">
      <h3>{{ title }}</h3>
      <div class="controls">
        <button class="btn" @click="resetCode">重置</button>
        <button class="btn" @click="shareCode">分享</button>
        <button class="btn success" @click="runCode">运行</button>
      </div>
    </div>

    <div class="editor-container" :style="{ height: containerHeight }">
      <!-- 左侧代码编辑器 -->
      <div class="editor-panel">
        <div class="panel-header">
          <span>📝 代码编辑器</span>
        </div>
        <textarea
            v-model="code"
            class="code-textarea"
            placeholder="在这里编写 Vue 组件代码..."
            @input="handleCodeChange"
            @keydown="handleKeydown"
        ></textarea>
      </div>

      <!-- 右侧预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <span>👁️ 实时预览</span>
        </div>
        <div class="preview-content">
          <div v-if="error" class="error-message">
            <strong>❌ 错误:</strong><br>
            {{ error }}
          </div>
          <div v-else-if="!compiledComponent" class="loading">
            正在编译组件...
          </div>
          <div v-else :id="containerId" class="component-container"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'

// Props
const props = defineProps({
  // 初始代码
  modelValue: {
    type: String,
    default: `<template>
  <div class="demo">
    <h2>{{ title }}</h2>
    <p>计数: {{ count }}</p>
    <button @click="increment" class="btn">点击 +1</button>
    <button @click="reset" class="btn secondary">重置</button>

    <div class="input-section">
      <input
        v-model="message"
        placeholder="输入一些文字..."
        class="input-field"
      />
      <p v-if="message">你输入了: {{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Vue 3 组件演示')
const count = ref(0)
const message = ref('')

const increment = () => count.value++
const reset = () => {
  count.value = 0
  message.value = ''
}
<\/script>

<style scoped>
.demo {
  padding: 20px;
  max-width: 500px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

.demo h2 {
  color: #42b883;
  margin-bottom: 20px;
  text-align: center;
}

.btn {
  margin: 5px;
  padding: 10px 20px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn:hover {
  background: #369870;
}

.btn.secondary {
  background: #6c757d;
}

.btn.secondary:hover {
  background: #545b62;
}

.input-section {
  margin-top: 20px;
}

.input-field {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 10px;
}

.input-field:focus {
  outline: none;
  border-color: #42b883;
}
</style>`
  },

  // 组件标题
  title: {
    type: String,
    default: '📝 Vue 代码编辑器'
  },

  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },

  // 容器高度
  height: {
    type: String,
    default: '600px'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'run', 'error'])

// 响应式数据
const code = ref(props.modelValue)
const containerHeight = ref(props.height)
const error = ref(null)
const compiledComponent = ref(null)
const containerId = ref(`vue-container-${Date.now()}`)
let currentApp = null

// 监听代码变化
const handleCodeChange = () => {
  emit('update:modelValue', code.value)
  emit('change', code.value)
  compileAndRender()
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== code.value) {
    code.value = newValue
    compileAndRender()
  }
})

// 编译和渲染组件
const compileAndRender = async () => {
  try {
    error.value = null

    // 解析 Vue 单文件组件
    const { template, script, style } = parseVueComponent(code.value)

    if (!template) {
      error.value = '缺少 template 部分'
      return
    }

    compiledComponent.value = { template, script, style }

    // 等待 DOM 更新
    await nextTick()

    // 渲染组件
    await renderComponent({ template, script, style })

  } catch (err) {
    error.value = err.message
    emit('error', err)
  }
}

// 解析 Vue 单文件组件
function parseVueComponent(code) {
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/)

  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : '',
    style: styleMatch ? styleMatch[1].trim() : ''
  }
}

// 检查 Vue 是否可用
function checkVueAvailability() {
  if (typeof window === 'undefined') return false
  return !!(window.Vue || window.vue)
}

// 渲染组件
async function renderComponent({ template, script, style }) {
  const container = document.getElementById(containerId.value)
  if (!container) return

  // 检查 Vue 是否可用
  if (!checkVueAvailability()) {
    container.innerHTML = `
      <div class="render-error">
        Vue 3 未加载！请在页面中添加：<br>
        <code>&lt;script src="https://unpkg.com/vue@3/dist/vue.global.js"&gt;&lt;/script&gt;</code>
      </div>
    `
    error.value = 'Vue 3 未加载'
    return
  }

  // 清理之前的应用
  if (currentApp) {
    currentApp.unmount()
    currentApp = null
  }

  // 清空容器
  container.innerHTML = ''

  try {
    // 执行脚本获取组件配置
    const componentConfig = executeScript(script)

    // 创建完整的组件配置
    const appConfig = {
      template: template,
      ...componentConfig
    }

    // 创建并挂载 Vue 应用
    const Vue = window.Vue || window.vue
    currentApp = Vue.createApp(appConfig)
    currentApp.mount(container)

    // 添加样式
    if (style) {
      addStyles(style)
    }

  } catch (err) {
    container.innerHTML = `<div class="render-error">渲染错误: ${err.message}</div>`
    throw err
  }
}

// 执行脚本并返回组件配置
function executeScript(script) {
  if (!script) return {}

  try {
    // 检查 Vue 是否可用
    if (!checkVueAvailability()) {
      throw new Error('Vue 3 未加载')
    }

    // 移除 import 语句
    const cleanScript = script
        .replace(/import\s+.*?from\s+['"]vue['"];?\s*/g, '')
        .replace(/import\s+{[^}]*}\s+from\s+['"]vue['"];?\s*/g, '')

    // 创建执行环境
    const Vue = window.Vue || window.vue
    const { ref, reactive, computed, watch, onMounted, onUnmounted } = Vue

    // 创建函数执行脚本
    const func = new Function('ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', `
      ${cleanScript}

      // 收集所有导出的变量
      const exports = {}
      const varNames = ${JSON.stringify(extractVariableNames(cleanScript))}

      varNames.forEach(name => {
        try {
          if (typeof eval(name) !== 'undefined') {
            exports[name] = eval(name)
          }
        } catch (e) {
          // 忽略未定义的变量
        }
      })

      return { setup: () => exports }
    `)

    return func(ref, reactive, computed, watch, onMounted, onUnmounted)
  } catch (err) {
    console.error('执行脚本错误:', err)
    throw err
  }
}

// 提取变量名
function extractVariableNames(script) {
  const varNames = []
  const patterns = [
    /const\s+(\w+)\s*=/g,
    /let\s+(\w+)\s*=/g,
    /var\s+(\w+)\s*=/g,
    /function\s+(\w+)\s*\(/g
  ]

  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(script)) !== null) {
      if (match[1] && !varNames.includes(match[1])) {
        varNames.push(match[1])
      }
    }
  })

  return varNames
}

// 添加样式
function addStyles(style) {
  const styleId = `vue-style-${containerId.value}`
  let styleElement = document.getElementById(styleId)

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = style
}

// 移除样式
function removeStyles() {
  const styleId = `vue-style-${containerId.value}`
  const styleElement = document.getElementById(styleId)
  if (styleElement) {
    styleElement.remove()
  }
}

// 方法
const resetCode = () => {
  code.value = props.modelValue
  emit('update:modelValue', props.modelValue)
  compileAndRender()
}

const shareCode = () => {
  const url = `${window.location.origin}${window.location.pathname}#${btoa(code.value)}`

  if (navigator.share) {
    navigator.share({
      title: '分享 Vue 代码',
      url: url
    })
  } else {
    navigator.clipboard?.writeText(url).then(() => {
      alert('链接已复制到剪贴板')
    }).catch(() => {
      console.log('分享链接:', url)
    })
  }
}

const runCode = () => {
  emit('run', code.value)
  compileAndRender()
}

const handleKeydown = (event) => {
  // Ctrl/Cmd + S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    emit('update:modelValue', code.value)
  }

  // Ctrl/Cmd + R 运行
  if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
    event.preventDefault()
    runCode()
  }

  // Tab 键缩进
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end)
    textarea.selectionStart = textarea.selectionEnd = start + 2

    handleCodeChange()
  }
}

// 生命周期
onMounted(() => {
  // 检查 Vue 是否可用
  if (!checkVueAvailability()) {
    error.value = 'Vue 3 未加载！请在页面中添加 Vue 3 CDN 链接。'
    return
  }

  compileAndRender()
})

onBeforeUnmount(() => {
  if (currentApp) {
    currentApp.unmount()
  }
  removeStyles()
})

// 暴露方法给父组件
defineExpose({
  resetCode,
  shareCode,
  runCode,
  getCode: () => code.value,
  setCode: (newCode) => {
    code.value = newCode
    compileAndRender()
  }
})
</script>

<style scoped>
.vue-code-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  font-family: Arial, sans-serif;
}

.header {
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  background: #6c757d;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn.success {
  background: #28a745;
}

.btn.success:hover {
  background: #218838;
}

.editor-container {
  display: flex;
  overflow: hidden;
}

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e1e5e9;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.panel-header {
  background: #f8f9fa;
  padding: 8px 12px;
  border-bottom: 1px solid #e1e5e9;
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.code-textarea {
  flex: 1;
  border: none;
  outline: none;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: #1e1e1e;
  color: #d4d4d4;
  resize: none;
  tab-size: 2;
}

.code-textarea::placeholder {
  color: #6c757d;
}

.preview-content {
  flex: 1;
  overflow: auto;
  background: #fff;
}

.component-container {
  padding: 16px;
  min-height: 100%;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 16px;
  margin: 16px;
  border-radius: 4px;
  border-left: 4px solid #dc3545;
  font-size: 14px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6c757d;
  font-style: italic;
}

.render-error {
  color: #dc3545;
  padding: 16px;
  background: #f8d7da;
  border-radius: 4px;
  margin: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-container {
    flex-direction: column;
  }

  .editor-panel {
    border-right: none;
    border-bottom: 1px solid #e1e5e9;
  }

  .editor-panel,
  .preview-panel {
    flex: none;
    height: 50%;
  }
}
</style>