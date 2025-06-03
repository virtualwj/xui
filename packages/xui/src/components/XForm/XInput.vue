<template>
  <div class="x-input-wrapper" :class="wrapperClasses">
    <!-- 1. 如果传了 label，就渲染在左侧 -->
    <label
        v-if="label"
        :for="inputId || null"
        class="x-input-label"
    >
      {{ label }}
    </label>

    <!-- 2. 具体的输入框区域 -->
    <div class="x-input-container">
      <input
          :id="inputId"
          class="x-input"
          :class="{ 'x-input-disabled': disabled, 'x-input-readonly': readonly }"
          :disabled="disabled"
          :readonly="readonly"
          :value="modelValue"
          @input="onInput"
          v-bind="extraAttrs"
      />
      <!-- 3. 清空按钮，只有 clearable 为 true 且有值时才显示 -->
      <button
          v-if="clearable && !disabled && !readonly && hasValue"
          type="button"
          class="x-input-clear"
          @click="onClear"
          aria-label="清空"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, toRefs } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  inputId: {
    type: String,
    default: ''
  },
  clearable: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  extraAttrs: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'clear'])

const { modelValue } = toRefs(props)
const hasValue = computed(() => modelValue.value !== '' && modelValue.value !== null && modelValue.value !== undefined)

const onInput = (e) => {
  emit('update:modelValue', e.target.value)
}

const onClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

// 根据传入的 disabled / readonly / hasValue 等生成动态 class
const wrapperClasses = computed(() => ({
  'x-input-disabled-wrapper': props.disabled,
  'x-input-readonly-wrapper': props.readonly,
  'x-input-has-value': hasValue.value
}))
</script>

<style scoped>
.x-input-wrapper {
  display: flex;
  flex-direction: row;      /* 原来是 column，改成 row */
  align-items: center;      /* 垂直居中 */
  box-sizing: border-box;
}

/* Label 放在左侧时，给它一个右侧间距 */
.x-input-label {
  font-size: 1em;
  color: #606266;
  margin-right: 0.5em;     /* 增加一点右边距 */
}

/* 输入框外层容器保持原来样式 */
.x-input-container {
  position: relative;
  flex: 1; /* 让输入框区域尽量撑满剩余宽度 */
}

.x-input {
  width: 100%;
  box-sizing: border-box;
  font-size: 1em;
  line-height: 1.5;
  padding: 0.5em;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  transition: border-color .2s;
}
.x-input:focus {
  border-color: #409eff;
}

/* 不同状态下的样式 */
.x-input-disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
  color: #c0c4cc;
}
.x-input-readonly {
  background-color: #f5f7fa;
  cursor: default;
  color: #606266;
}

/* 清空按钮 */
.x-input-clear {
  position: absolute;
  right: 0.5em;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  font-size: 1.2em;
  color: #c0c4cc;
  cursor: pointer;
  outline: none;
  padding: 0;
  line-height: 1;
}
.x-input-clear:hover {
  color: #909399;
}

/* 如果有值，给输入框增加右侧 padding，以免文字和清空按钮重叠 */
.x-input-has-value .x-input {
  padding-right: 2em;
}
</style>