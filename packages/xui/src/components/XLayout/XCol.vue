<template>
  <div class="x-col" :style="colStyle">
    <slot />
  </div>
</template>

<script>
import { defineComponent, inject, computed } from 'vue';

export default defineComponent({
  name: 'XColumn',
  props: {
    /**
     * span: 占据的列数。共 12 列格子，值必须在 1~12 之间。
     * 例如：span=6 表示宽度为 6 / 12 = 50%
     */
    span: {
      type: Number,
      default: 12,
      validator: (val) => val >= 1 && val <= 12,
    },
  },
  setup(props) {
    // 从上层 XRow 注入 gutter，若外层没有 XRow，则默认 0
    const gutter = inject('xRowGutter', 0);

    // 计算每列左右的 padding
    const paddingLR = computed(() => {
      const half = gutter / 2;
      return {
        paddingLeft: `${half}px`,
        paddingRight: `${half}px`,
      };
    });

    // 计算宽度百分比：span / 12 * 100%
    const widthPct = computed(() => {
      return `${(props.span / 12) * 100}%`;
    });

    // 最终列的样式：包含 padding 和宽度
    const colStyle = computed(() => {
      return {
        boxSizing: 'border-box',
        flex: `0 0 ${widthPct.value}`,
        maxWidth: widthPct.value,
        ...paddingLR.value,
      };
    });

    return {
      colStyle,
    };
  },
});
</script>

<style scoped>
.x-col {
  /*
    注意：这里不需要再写 display 或 flex 属性，
    由 XRow 负责整体 flex 布局；XColumn 仅需设置宽度和 padding
  */
}
</style>