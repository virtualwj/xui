// index.ts
import type { App } from 'vue'

const modules = import.meta.glob('./components/**/*.vue', { eager: true })
const components: Record<string, any> = {}

Object.entries(modules).forEach(([path, module]) => {
    const componentName = path.match(/\/([^/]+)\.vue$/)?.[1]
    if (componentName) {
        console.log("XUI加载组件",componentName)
        components[componentName] = (module as any).default
    }
})

// 作为 Vue 插件导出
export default {
    install(app: App) {
        Object.entries(components).forEach(([name, component]) => {
            app.component(name, component)
        })
    }
}

// 同时导出各个组件
export const { XButton, XColumn, XGrid, XRegion } = components