import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'
import babel from '@rollup/plugin-babel'
import alias from '@rollup/plugin-alias'
import vue from 'rollup-plugin-vue'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

/**
 * Rollup Configuration
 */
export default defineConfig([
  {
    input: 'src/index.vue',
    output: [
      {
        dir: 'dist',
        format: 'es',
        entryFileNames: chunk => `[name].mjs`
      },
      {
        dir: 'dist',
        format: 'umd',
        name: 'MyLib',
        entryFileNames: chunk => `[name].umd.js`
      },
      {
        dir: 'dist',
        format: 'cjs',
        exports: 'named',
        entryFileNames: chunk => `[name].cjs`
      }
    ],
    plugins: [
      alias({
        entries: [{
          find: '@',
          replacement: new URL('./src', import.meta.url).pathname
        }]
      }),

      nodeResolve(),
      commonjs(),
      typescript({
        check: false
      }),
      vue(),
      postcss(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        extensions: ['.js', '.vue']
      }),
      // serve({
      //   contentBase: '',  //服务器启动的文件夹，默认是项目根目录，需要在该文件下创建index.html
      //   port: 8020   //端口号，默认10001
      // }),
      // livereload('dist')
    ],
    external: [
      /^vue(\/.+|$)/,
      /^ant-design-vue(\/.+|$)/,
      /^@ant-design\/icons-vue/
    ]
  }
])
