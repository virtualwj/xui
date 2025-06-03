<!-- XGrid.vue -->
<template>
  <div class="x-grid-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="x-grid-loading">
      正在加载数据...
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="x-grid-error">
      {{ error }}
      <button @click="fetchData" class="x-grid-retry-btn">重试</button>
    </div>

    <!-- 表格内容 -->
    <table v-else class="x-grid-table">
      <thead>
      <tr>
        <!-- 根据从插槽里解析出来的 columns 数组，渲染表头 -->
        <th
            v-for="col in columns"
            :key="col.field"
            :style="{ width: col.width ? col.width + (typeof col.width === 'number' ? 'px' : '') : 'auto', textAlign: col.align }"
        >
          {{ col.title }}
        </th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="(row, rowIndex) in currentData" :key="rowIndex">
        <td
            v-for="col in columns"
            :key="col.field"
            :style="{ textAlign: col.align }"
        >
          <!--
            如果 col.slotName 存在，就走具名插槽渲染，否则直接显示 row[col.field]
            具名插槽使用方式见下方"使用示例"。
          -->
          <template v-if="col.slotName && $slots[col.slotName]">
            <!-- 把当前行数据和列信息传给具名插槽 -->
            <slot :name="col.slotName" :row="row" :column="col" />
          </template>
          <template v-else>
            {{ row[col.field] }}
          </template>
        </td>
      </tr>
      <!-- 如果没有数据，渲染一个空行提示 -->
      <tr v-if="!currentData || currentData.length === 0">
        <td :colspan="columns.length" class="x-grid-empty">
          暂无数据
        </td>
      </tr>
      </tbody>
    </table>

    <!-- 下面这个 slot 用来放置所有的 <XColumn>，只为了让它们"挂"在这里，使得上面 setup() 能够读到 -->
    <slot />
  </div>
</template>

<script setup>
import { computed, useSlots, ref, onMounted, watch } from 'vue'
import XColumn from './XColumn.vue' // 确保路径正确

// 接收父组件传入的参数
const props = defineProps({
  // 静态数据，当没有 baseUrl 时使用
  data: {
    type: Array,
    default: () => [
      { name: '张三', age: 28, actions: '' },
      { name: '李四', age: 32, actions: '' },
      { name: '王五', age: 23, actions: '' }
    ]
  },
  // 远程数据源地址
  baseUrl: {
    type: String,
    default: ''
  },
  // 请求参数
  params: {
    type: Object,
    default: () => ({})
  },
  // 请求方法
  method: {
    type: String,
    default: 'GET'
  },
  // 请求头
  headers: {
    type: Object,
    default: () => ({})
  },
  // 数据路径，用于从响应中提取数据数组
  dataPath: {
    type: String,
    default: 'data' // 例如：响应格式 { code: 0, data: [...], message: '' }
  },
  // 是否自动加载数据
  autoLoad: {
    type: Boolean,
    default: true
  }
})

// 拿到默认插槽的 vnode 列表
const slots = useSlots()

// 响应式数据
const loading = ref(false)
const error = ref('')
const remoteData = ref([])

// 当前使用的数据：如果有 baseUrl 则使用远程数据，否则使用 props.data
const currentData = computed(() => {
  return props.baseUrl ? remoteData.value : props.data
})

// 解析出列配置
const columns = computed(() => {
  // slots.default() 返回的是 vnode 数组
  const vnodes = slots.default ? slots.default() : []
  // 过滤出类型为 XColumn 的 vnode，然后提取 .props
  return vnodes
      .filter(vnode => {
        // Vue 在编译阶段会给组件 type 一个对象，可以通过 name 判断
        // 注意：如果你在打包时更改了组件名，要确认 vnode.type.name 与这里保持一致
        return vnode.type && vnode.type.name === 'XColumn'
      })
      .map(vnode => {
        // vnode.props 就是传给 <XColumn> 的那些 props，直接拿来当做列定义
        // 这里可以做一些默认合并或校验：
        const p = vnode.props || {}
        return {
          field: p.field,
          title: p.title,
          width: p.width,
          align: p.align || 'left',
          slotName: p.slotName || null
        }
      })
})

// 获取远程数据
const fetchData = async () => {
  if (!props.baseUrl) return

  loading.value = true
  error.value = ''

  try {
    const url = new URL(props.baseUrl)

    // 处理 GET 请求参数
    if (props.method.toUpperCase() === 'GET' && props.params) {
      Object.keys(props.params).forEach(key => {
        url.searchParams.append(key, props.params[key])
      })
    }

    const requestOptions = {
      method: props.method,
      headers: {
        'Content-Type': 'application/json',
        ...props.headers
      }
    }

    // 处理 POST 请求参数
    if (props.method.toUpperCase() !== 'GET' && props.params) {
      requestOptions.body = JSON.stringify(props.params)
    }

    const response = await fetch(url.toString(), requestOptions)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    // 根据 dataPath 提取数据
    let data = result
    if (props.dataPath) {
      const paths = props.dataPath.split('.')
      for (const path of paths) {
        data = data?.[path]
      }
    }

    if (!Array.isArray(data)) {
      throw new Error('响应数据不是数组格式')
    }

    remoteData.value = data
  } catch (err) {
    error.value = `数据加载失败: ${err.message}`
    console.error('XGrid 数据获取错误:', err)
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
const refresh = () => {
  fetchData()
}

// 组件挂载后自动加载数据
onMounted(() => {
  if (props.baseUrl && props.autoLoad) {
    fetchData()
  }
})

// 监听 baseUrl 和 params 变化，重新获取数据
watch([() => props.baseUrl, () => props.params], () => {
  if (props.baseUrl && props.autoLoad) {
    fetchData()
  }
}, { deep: true })

// 导出组件实例的名称和方法
const __name = 'XGrid'

// 暴露方法给父组件使用
defineExpose({
  refresh,
  fetchData,
  loading,
  error
})
</script>

<style scoped>
.x-grid-container {
  width: 100%;
}

.x-grid-table {
  width: 100%;
  border-collapse: collapse;
}

.x-grid-table th,
.x-grid-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
}

.x-grid-empty {
  text-align: center;
  color: #999;
  padding: 16px 0;
}

.x-grid-loading {
  text-align: center;
  padding: 40px 0;
  color: #666;
  font-size: 14px;
}

.x-grid-error {
  text-align: center;
  padding: 40px 0;
  color: #f56565;
  font-size: 14px;
}

.x-grid-retry-btn {
  margin-left: 8px;
  padding: 4px 12px;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.x-grid-retry-btn:hover {
  background-color: #2c5aa0;
}
</style>