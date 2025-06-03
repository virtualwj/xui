// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // build: {
  //   lib: {
  //     entry: resolve(__dirname, 'src/components/XButton/index.ts'),
  //     name: 'XButton',
  //     fileName: (format) => `index.${format}.js`,
  //     formats: ['es', 'umd', 'cjs']
  //   },
  //   rollupOptions: {
  //     external: ['vue'],
  //     output: {
  //       globals: {
  //         vue: 'Vue'
  //       },
  //       assetFileNames: `XButton.css`
  //     }
  //   }
  // }
})