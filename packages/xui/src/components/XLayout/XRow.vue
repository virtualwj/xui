<template>
  <div class="x-row" :style="rowStyle">
    <slot />
  </div>
</template>

<script>
import { defineComponent, provide, computed } from 'vue';

export default defineComponent({
  name: 'XRow',
  props: {
    /**
     * gutter: 列之间的间距（单位：px）
     *     默认为 0，表示没有间距。XColumn 会根据此值自动在左右两侧添加内边距。
     */
    gutter: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    // 将 gutter 通过 provide 传递给子组件 XColumn
    provide('xRowGutter', props.gutter);

    // 计算 XRow 的左右负边距，使得第一列和最后一列与容器左/右对齐，
    // 同时各列之间通过 XColumn 的左右 padding 对齐
    const rowStyle = computed(() => {
      const half = props.gutter / 2;
      return {
        marginLeft: `-${half}px`,
        marginRight: `-${half}px`,
      };
    });

    return {
      rowStyle,
    };
  },
});
</script>

<style scoped>
.x-row {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}
</style>