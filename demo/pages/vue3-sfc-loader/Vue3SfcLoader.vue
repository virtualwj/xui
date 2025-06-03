<template>
  <div class="container">

    <div class="editor-section">
      <h2>编辑Vue模板</h2>
      <div ref="editorContainer" class="monaco-editor-container"></div>
    </div>

    <div class="render-section">
      <h2>渲染结果</h2>
      <DynamicVueRenderer
          :template="vueTemplate"
          :component-props="dynamicProps"
      />
    </div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import * as monaco from 'monaco-editor'
import DynamicVueRenderer from './DynamicVueRenderer.vue'

const editorContainer = ref(null)
let editor = null

const vueTemplate = ref(`<div class="dynamic-component">
  <div>hello world</div>
  <XRegion id="r1" title="查询表">
     <XRow :gutter="16">
      <XCol :span="4">
        <XInput
  label= "邮箱"
  placeholder="请输入邮箱"
/>
      </XCol>
      <XCol :span="4">
        <div class="box"></div>
      </XCol>
      <XCol :span="4">
            <XButton type="primary" @click="alert('查询')">查询</XButton>
      </XCol>
    </XRow>
</XRegion>
<XRegion id="r2" title="结果展示">
 <XGrid baseUrl="https://dummyjson.com/users"
    :params="{ page: 1, size: 10 }"
    method="GET"
    dataPath="users"
    ref="gridRef">
    <!-- 普通列：直接渲染字段值 -->
    <XColumn field="username" title="姓名" width="200" align="left" />
    <XColumn field="age" title="年龄" width="80" align="center" />
    <XColumn field="gender" title="性别" width="80" align="center" />
    <XColumn field="phone" title="电话号码" width="80" align="center" />
  </XGrid>
</XRegion>
</div>`)

const dynamicProps = ref({
  title: '我的动态组件',
  description: '这个组件是通过字符串模板动态生成的！'
})

// 初始化Monaco Editor
const initMonacoEditor = () => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: vueTemplate.value,
      language: 'html', // 使用html语法高亮，因为template部分主要是HTML
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: {enabled: false},
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible'
      },
      folding: true,
      bracketMatching: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true
    })

    // 监听编辑器内容变化
    editor.onDidChangeModelContent(() => {
      vueTemplate.value = editor.getValue()
    })
  }
}

onMounted(() => {
  initMonacoEditor()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped lang="scss">
.container {
  display: flex;
  width: 100%;
  position: relative;
  &>div {
    width: 50%;
    padding: 12px;
  }
}

.monaco-editor-container {
  width: 100%;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.render-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

h1, h2 {
  color: #333;
}

h2 {
  border-bottom: 2px solid #42b883;
  padding-bottom: 5px;
}
</style>