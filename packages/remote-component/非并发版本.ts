import { createApp } from 'vue'
import * as Vue from 'vue'
import { parse } from '@vue/compiler-dom'
import TestImport from "./App.vue"

interface ComponentConfig {
    url: string
    cssUrl?: string
    globalName: string
    componentName: string
    version?: string
    dependencies?: string[]
}

// 模拟后端API响应
interface ComponentRegistryResponse {
    success: boolean
    data: Record<string, ComponentConfig>
    message?: string
}

class DynamicComponentLoader {
    loadedComponents = new Map<string, any>()
    loadingPromises = new Map<string, Promise<any>>()
    loadedScripts = new Set<string>()
    loadedStyles = new Set<string>()
    componentRegistry = new Map<string, ComponentConfig>()

    // 使用Vue编译器解析模板，收集组件标签
    parseTemplate(template: string): string[] {
        const componentTags = new Set<string>()

        try {
            const ast = parse(template)
            this.traverseAST(ast, componentTags)
        } catch (error) {
            console.error('模板解析失败:', error)
        }

        return Array.from(componentTags)
    }

    // 遍历AST节点
    traverseAST(node: any, componentTags: Set<string>) {
        if (!node) return

        // 检查元素节点
        if (node.type === 1) { // ELEMENT
            const tagName = node.tag.toLowerCase()
            // 收集所有包含连字符的自定义组件标签
            if (tagName.includes('-')) {
                componentTags.add(tagName)
            }
        }

        // 递归遍历子节点
        if (node.children) {
            node.children.forEach((child: any) => {
                this.traverseAST(child, componentTags)
            })
        }
    }

    // 模拟后端API查询组件注册信息
    async fetchComponentConfigs(componentTags: string[]): Promise<ComponentRegistryResponse> {
        console.log('🔍 查询组件注册信息:', componentTags)

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300))

        // 模拟后端数据
        const mockComponentRegistry: Record<string, ComponentConfig> = {
            'x-region': {
                url: '/XRegion/index.umd.js',
                cssUrl: '/XRegion/XRegion.css',
                globalName: 'XRegion',
                componentName: 'XRegion',
                version: '1.2.0',
                dependencies: []
            },
            'x-button': {
                url: '/XButton/index.umd.js',
                cssUrl: '/XButton/XButton.css',
                globalName: 'XButton',
                componentName: 'XButton',
                version: '2.1.0',
                dependencies: []
            },
        }

        // 过滤出存在的组件
        const availableComponents: Record<string, ComponentConfig> = {}
        const notFoundComponents: string[] = []

        componentTags.forEach(tag => {
            if (mockComponentRegistry[tag]) {
                availableComponents[tag] = mockComponentRegistry[tag]
            } else {
                notFoundComponents.push(tag)
            }
        })

        if (notFoundComponents.length > 0) {
            console.warn('⚠️ 以下组件未在注册表中找到:', notFoundComponents)
        }

        return {
            success: true,
            data: availableComponents,
            message: `查询完成，找到 ${Object.keys(availableComponents).length} 个组件`
        }
    }

    // 解析组件依赖关系，返回正确的加载顺序
    resolveDependencies(components: Record<string, ComponentConfig>): string[] {
        const visited = new Set<string>()
        const visiting = new Set<string>()
        const result: string[] = []

        const visit = (componentTag: string) => {
            if (visited.has(componentTag)) return
            if (visiting.has(componentTag)) {
                console.warn(`⚠️ 检测到循环依赖: ${componentTag}`)
                return
            }

            visiting.add(componentTag)

            const config = components[componentTag]
            if (config && config.dependencies) {
                config.dependencies.forEach(dep => {
                    if (components[dep]) {
                        visit(dep)
                    }
                })
            }

            visiting.delete(componentTag)
            visited.add(componentTag)
            result.push(componentTag)
        }

        Object.keys(components).forEach(componentTag => {
            if (!visited.has(componentTag)) {
                visit(componentTag)
            }
        })

        return result
    }

    // 加载CSS样式文件
    async loadCSS(cssUrl: string): Promise<void> {
        return new Promise((resolve) => {
            if (this.loadedStyles.has(cssUrl)) {
                resolve()
                return
            }

            const existingLink = document.querySelector(`link[href="${cssUrl}"]`)
            if (existingLink) {
                this.loadedStyles.add(cssUrl)
                resolve()
                return
            }

            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.type = 'text/css'
            link.href = cssUrl

            link.onload = () => {
                this.loadedStyles.add(cssUrl)
                console.log(`✅ CSS样式 ${cssUrl} 加载成功`)
                resolve()
            }

            link.onerror = () => {
                console.warn(`⚠️ CSS样式加载失败: ${cssUrl}`)
                resolve() // CSS加载失败不阻止组件加载
            }

            document.head.appendChild(link)
        })
    }

    // 加载UMD脚本
    async loadUMDScript(url: string, globalName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.loadedScripts.has(url)) {
                const component = (window as any)[globalName]
                component ? resolve(component) : reject(new Error(`全局变量 ${globalName} 不存在`))
                return
            }

            const existingScript = document.querySelector(`script[src="${url}"]`)
            if (existingScript) {
                if ((window as any)[globalName]) {
                    this.loadedScripts.add(url)
                    resolve((window as any)[globalName])
                    return
                } else {
                    existingScript.addEventListener('load', () => {
                        this.loadedScripts.add(url)
                        const component = (window as any)[globalName]
                        component ? resolve(component) : reject(new Error(`全局变量 ${globalName} 不存在`))
                    })
                    return
                }
            }

            const script = document.createElement('script')
            script.src = url
            script.type = 'text/javascript'

            script.onload = () => {
                this.loadedScripts.add(url)
                const component = (window as any)[globalName]
                if (component) {
                    console.log(`✅ UMD组件 ${globalName} 加载成功`)
                    resolve(component)
                } else {
                    reject(new Error(`UMD脚本加载完成，但全局变量 ${globalName} 不存在`))
                }
            }

            script.onerror = () => {
                reject(new Error(`UMD脚本加载失败: ${url}`))
            }

            document.head.appendChild(script)
        })
    }

    // 加载单个远程组件
    async loadRemoteComponent(tagName: string, config: ComponentConfig) {
        if (this.loadedComponents.has(tagName)) {
            return this.loadedComponents.get(tagName)
        }

        if (this.loadingPromises.has(tagName)) {
            return this.loadingPromises.get(tagName)
        }

        const loadingPromise = this._loadComponent(config, tagName)
        this.loadingPromises.set(tagName, loadingPromise)

        try {
            const component = await loadingPromise
            this.loadedComponents.set(tagName, component)
            this.loadingPromises.delete(tagName)
            return component
        } catch (error) {
            this.loadingPromises.delete(tagName)
            throw error
        }
    }

    async _loadComponent(config: ComponentConfig, tagName: string) {
        try {
            if (!(window as any).Vue) {
                (window as any).Vue = Vue
            }

            console.log(`🔄 开始加载组件 ${tagName} (v${config.version})...`)

            const loadPromises: Promise<any>[] = []

            if (config.cssUrl) {
                loadPromises.push(this.loadCSS(config.cssUrl))
            }

            loadPromises.push(this.loadUMDScript(config.url, config.globalName))

            const results = await Promise.allSettled(loadPromises)

            const componentResult = results[results.length - 1]
            if (componentResult.status === 'rejected') {
                throw componentResult.reason
            }

            const ComponentConstructor = componentResult.value

            if (typeof ComponentConstructor !== 'object' && typeof ComponentConstructor !== 'function') {
                throw new Error(`加载的组件格式不正确: ${config.globalName}`)
            }

            console.log(`✅ 组件 ${tagName} (v${config.version}) 加载完成`)
            return ComponentConstructor

        } catch (error) {
            console.error(`组件 ${tagName} 加载失败:`, error)

            return {
                template: `
                    <div style="
                        padding: 12px; margin: 8px 0; border: 1px solid #ff6b6b; 
                        border-radius: 6px; background-color: #fff1f1; color: #d63031;
                        font-family: Arial, sans-serif;
                    ">
                        <div style="font-weight: bold; margin-bottom: 4px;">
                            ⚠️ 组件加载失败: ${tagName}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            ${(error as Error).message}
                        </div>
                        <details style="margin-top: 8px; font-size: 11px;">
                            <summary>详细信息</summary>
                            <pre style="margin-top: 4px; white-space: pre-wrap;">${(error as Error).stack || '无堆栈信息'}</pre>
                        </details>
                    </div>
                `,
                name: `${config.componentName}Error`
            }
        }
    }

    // 主要的加载流程：解析模板 -> 查询后端 -> 按依赖顺序加载
    async loadComponentsFromTemplate(template: string) {
        console.log('🔍 第一步：解析模板，收集组件标签...')

        // 1. 解析模板，收集所有自定义组件标签
        const componentTags = this.parseTemplate(template)
        console.log('📋 发现的组件标签:', componentTags)

        if (componentTags.length === 0) {
            console.log('✨ 模板中没有自定义组件')
            return {}
        }

        console.log('🌐 第二步：查询后端组件注册信息...')

        // 2. 查询后端获取组件配置信息
        const registryResponse = await this.fetchComponentConfigs(componentTags)

        if (!registryResponse.success) {
            throw new Error(`后端查询失败: ${registryResponse.message}`)
        }

        const availableComponents = registryResponse.data
        console.log('📦 后端返回的可用组件:', Object.keys(availableComponents))

        if (Object.keys(availableComponents).length === 0) {
            console.log('⚠️ 没有找到可用的组件配置')
            return {}
        }

        console.log('🔗 第三步：解析组件依赖关系...')

        // 3. 解析依赖关系，确定加载顺序
        const loadingOrder = this.resolveDependencies(availableComponents)
        console.log('📊 组件加载顺序:', loadingOrder)

        console.log('🚀 第四步：按顺序加载组件...')

        // 4. 按依赖顺序依次加载组件
        const loadedComponents: Record<string, any> = {}
        const errors: Array<{ tagName: string, error: any }> = []

        for (const tagName of loadingOrder) {
            try {
                const config = availableComponents[tagName]
                const component = await this.loadRemoteComponent(tagName, config)
                loadedComponents[config.componentName] = component

                // 缓存配置信息
                this.componentRegistry.set(tagName, config)

                console.log(`✅ ${tagName} -> ${config.componentName} 加载成功`)
            } catch (error) {
                errors.push({ tagName, error })
                console.error(`❌ ${tagName} 加载失败:`, error)
            }
        }

        if (errors.length > 0) {
            console.warn(`⚠️ ${errors.length} 个组件加载失败，但应用将继续运行`)
        }

        console.log('🎉 组件加载流程完成!')
        return loadedComponents
    }

    // 获取加载状态信息
    getLoadingStatus() {
        return {
            loadedComponents: Array.from(this.loadedComponents.keys()),
            loadedScripts: Array.from(this.loadedScripts),
            loadedStyles: Array.from(this.loadedStyles),
            loadingInProgress: Array.from(this.loadingPromises.keys()),
            componentRegistry: Object.fromEntries(this.componentRegistry)
        }
    }

    // 手动注册组件配置（用于测试或特殊情况）
    registerComponent(tagName: string, config: ComponentConfig) {
        this.componentRegistry.set(tagName, config)
        console.log(`📝 手动注册组件: ${tagName}`)
    }
}

// 应用初始化
async function initApp() {
    try {
        const app = createApp(TestImport)
        const loader = new DynamicComponentLoader()

        // 模板示例，包含依赖关系的组件
        const template = `
            <div>
                <h1>动态组件测试</h1>
                <x-region :data="regionData" />
                <x-button type="primary">点击我</x-button>
            </div>
        `

        console.log('🎯 开始动态组件加载流程...')

        const components = await loader.loadComponentsFromTemplate(template)

        // 注册所有成功加载的组件
        Object.entries(components).forEach(([componentName, component]) => {
            app.component(componentName, component)
            console.log(`🔧 注册组件到Vue应用: ${componentName}`)
        })

        // 开发环境调试
        if (import.meta.env?.DEV) {
            (window as any).app = app
            ;(window as any).componentLoader = loader
            ;(window as any).Vue = Vue
            ;(window as any).getLoadingStatus = () => loader.getLoadingStatus()
        }

        app.mount('#app')
        console.log('🎉 应用启动完成!')

        // 输出最终加载状态
        console.log('📊 最终加载状态:', loader.getLoadingStatus())

    } catch (error) {
        console.error('💥 应用初始化失败:', error)
    }
}

// 启动应用
initApp()