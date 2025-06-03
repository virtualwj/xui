<template>
  <div class="app-container">
    <AsyncComp/>

    <!-- 左侧：Monaco编辑器 -->
    <div class="editor-panel">
      <div ref="editorContainer" class="monaco-editor"></div>
    </div>

    <!-- 右侧：渲染区域 -->
    <div class="preview-panel">
      <div class="preview-content">
        <JsonRenderer :node="jsonTree" v-if="jsonTree" />
        <div v-else class="error-message">
          {{ parseError || '请输入有效的Vue模板代码' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup >
import {ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent} from 'vue'
import { parse } from '@vue/compiler-dom'
import JsonRenderer from './components/JsonRenderer.vue'
import * as monaco from 'monaco-editor'

const editorContainer = ref(null)
const input = ref(`<XRegion id="r1" title="查询表">
  <XButton type="primary" @click="alert('查询')">查询</XButton>
</XRegion>`)
const parseError = ref('')

const AsyncComp = defineAsyncComponent(() => {
  return new Promise((resolve, reject) => {
    resolve('/vuejs3-datepicker.umd.cjs')
  })
})




let editor = null

onMounted(() => {
  // 初始化Monaco Editor
  editor = monaco.editor.create(editorContainer.value, {
    value: input.value,
    language: 'html',
    theme: 'vs-light',
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    lineNumbers: 'on',
    folding: true,
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    automaticLayout: true
  })

  // 监听编辑器内容变化
  editor.onDidChangeModelContent(() => {
    input.value = editor.getValue()
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})

function toJson(node) {
  if (node.type === 1) {
    const props = {}
    for (const prop of node.props) {
      if (prop.type === 6) {
        props[prop.name] = prop.value?.content
      } else if (prop.type === 7) {
        props[`@${prop.name}`] = prop.exp?.content
      }
    }
    return {
      type: node.tag,
      props,
      children: node.children.map(toJson).filter(Boolean)
    }
  } else if (node.type === 2) {
    return node.content.trim() ? node.content : null
  }
  return null
}

const jsonTree = computed(() => {
  try {
    parseError.value = ''
    const ast = parse(input.value)
    return ast.children.length > 0 ? toJson(ast.children[0]) : null
  } catch (e) {
    parseError.value = `解析错误: ${e.message}`
    return null
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
}

.editor-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}

.monaco-editor {
  flex: 1;
  min-height: 0;
}

.preview-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.preview-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.error-message {
  color: #e74c3c;
  font-family: monospace;
  background-color: #fdf2f2;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #e74c3c;
}
</style>