import { build } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import vue from "@vitejs/plugin-vue";

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


const components = ['XRegion']

for (const name of components) {
    await build({
        plugins: [vue()],
        build: {
            lib: {
                entry: resolve(__dirname, `src/components/${name}/index.ts`),
                name, // 👈 控制 UMD 全局变量名
                fileName: (format) => `${name}.${format}.js`,
                formats: ['umd', "es"]
            },
            rollupOptions: {
                external: ['vue'],
                output: {
                    globals: {
                        vue: 'Vue'
                    },
                    assetFileNames: `${name}.css`
                }
            }
        }
    })
}