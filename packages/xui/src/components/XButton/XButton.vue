<template>
  <button :class="['ef-button', type]" @click="$emit('click')">
    <slot />
  </button>
</template>

<script>
export default {
  props: {
    type: String
  }
}
</script>

<style>
.ef-button {
  padding: 6px 12px;
  margin-top: 5px;
  cursor: pointer;
}
.primary {
  background: #409eff;
  color: white;
}
</style>