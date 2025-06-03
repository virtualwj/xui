<!-- 使用示例 -->
<template>
  <div class="app">
    <h1>Vue REPL 编辑器演示</h1>

    <!-- 基本使用 -->
    <VueCodeEditor
        v-model="code"
        title="🚀 我的代码编辑器"
        height="500px"
        @change="handleCodeChange"
        @run="handleRun"
        @error="handleError"
    />

    <!-- 不显示头部的紧凑版本 -->
    <div style="margin-top: 20px;">
      <h2>紧凑版本（无头部）</h2>
      <VueCodeEditor
          v-model="simpleCode"
          :show-header="false"
          height="400px"
          editor-type="codemirror"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VueCodeEditor from './VueCodeEditor.vue'

const code = ref(`<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="count++" class="btn">
      点击了 {{ count }} 次
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const msg = ref('Hello Vue!')
const count = ref(0)
<\/script>

<style scoped>
.hello {
  text-align: center;
  padding: 20px;
}

.btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.btn:hover {
  background: #369870;
}
</style>`)

const simpleCode = ref(`<template>
  <div class="card">
    <h3>简单示例</h3>
    <p>{{ message }}</p>
    <input v-model="message" placeholder="输入文字..." />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('这是一个简单的 Vue 组件')
<\/script>

<style scoped>
.card {
  background: #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  max-width: 300px;
  margin: 0 auto;
}

input {
  width: 100%;
  padding: 8px;
  margin-top: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>`)

// 事件处理
const handleCodeChange = (newCode) => {
  console.log('代码已更改:', newCode)
}

const handleRun = (code) => {
  console.log('运行代码:', code)
  // 这里可以添加代码运行的逻辑
}

const handleError = (errors) => {
  console.error('编译错误:', errors)
  // 这里可以添加错误处理逻辑
}
</script>

<style>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #34495e;
  margin-bottom: 15px;
}
</style>