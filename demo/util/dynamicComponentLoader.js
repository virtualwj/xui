// 组件加载器类 - 使用 Vue parse 改进版本
class DynamicComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.componentRegistry = new Map();
        this.loadingPromises = new Map();
    }

    // 使用 Vue 模板解析器解析组件名称
    parseComponentNames(template) {
        const components = new Set();

        try {
            // 使用 Vue 的编译器解析模板
            const ast = Vue.compile(template, {
                mode: 'module',
                prefixIdentifiers: true
            });

            // 遍历 AST 节点收集组件名称
            this.traverseAST(ast, components);

        } catch (error) {
            console.warn('Vue parse failed, falling back to regex:', error);
            // 如果 Vue parse 失败，回退到正则表达式方法
            return this.parseComponentNamesWithRegex(template);
        }

        return Array.from(components);
    }

    // 遍历 AST 节点
    traverseAST(node, components) {
        if (!node) return;

        // 处理不同类型的节点
        if (node.type === 1) { // ELEMENT 节点
            const tagName = node.tag;
            // 检查是否是自定义组件（首字母大写）
            if (tagName && /^[A-Z]/.test(tagName)) {
                components.add(tagName);
            }
        }

        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => this.traverseAST(child, components));
        }

        // 处理 v-for, v-if 等指令中可能包含的组件
        if (node.codegenNode) {
            this.traverseCodegenNode(node.codegenNode, components);
        }
    }

    // 遍历代码生成节点
    traverseCodegenNode(node, components) {
        if (!node) return;

        // 处理组件调用
        if (node.type === 13 && node.tag) { // VNODE_CALL
            if (typeof node.tag === 'string' && /^[A-Z]/.test(node.tag)) {
                components.add(node.tag);
            }
        }

        // 递归处理子节点
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(child => this.traverseCodegenNode(child, components));
        }

        if (node.props && Array.isArray(node.props)) {
            node.props.forEach(prop => this.traverseCodegenNode(prop, components));
        }
    }

    // 备用的正则表达式解析方法
    parseComponentNamesWithRegex(template) {
        const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
        const components = new Set();
        let match;

        while ((match = componentRegex.exec(template)) !== null) {
            components.add(match[1]);
        }

        return Array.from(components);
    }

    // 使用 Vue 的模板编译器进行更精确的解析（推荐方法）
    parseComponentNamesAdvanced(template) {
        const components = new Set();

        try {
            // 创建一个临时的 Vue 应用来解析模板
            const tempApp = Vue.createApp({
                template: `<div>${template}</div>`,
                // 捕获未知组件的钩子
                errorCaptured(err, instance, info) {
                    // 这里可以捕获到未注册的组件信息
                    if (info.includes('Failed to resolve component')) {
                        const match = err.message.match(/Failed to resolve component: (.+)/);
                        if (match) {
                            components.add(match[1]);
                        }
                    }
                    return false;
                }
            });

            // 使用自定义的全局属性来收集组件名称
            const originalResolveDynamicComponent = Vue.resolveDynamicComponent;
            Vue.resolveDynamicComponent = (component) => {
                if (typeof component === 'string' && /^[A-Z]/.test(component)) {
                    components.add(component);
                }
                return originalResolveDynamicComponent(component);
            };

            // 编译模板（不实际挂载）
            const compiled = Vue.compile(template);

            // 恢复原始方法
            Vue.resolveDynamicComponent = originalResolveDynamicComponent;

        } catch (error) {
            console.warn('Advanced parsing failed:', error);
            return this.parseComponentNamesWithRegex(template);
        }

        return Array.from(components);
    }

    // 动态加载单个组件
    async loadComponent(componentName) {
        // 如果已经加载过，直接返回
        if (this.loadedComponents.has(componentName)) {
            return this.componentRegistry.get(componentName);
        }

        // 如果正在加载中，返回加载Promise
        if (this.loadingPromises.has(componentName)) {
            return this.loadingPromises.get(componentName);
        }

        // 创建加载Promise
        const loadingPromise = this.fetchAndLoadComponent(componentName);
        this.loadingPromises.set(componentName, loadingPromise);

        try {
            const component = await loadingPromise;
            this.loadedComponents.add(componentName);
            this.componentRegistry.set(componentName, component);
            this.loadingPromises.delete(componentName);
            return component;
        } catch (error) {
            this.loadingPromises.delete(componentName);
            throw error;
        }
    }

    // 从后台获取并加载组件
    async fetchAndLoadComponent(componentName) {
        try {
            // 1. 向后台查询组件的JS文件URL
            const response = await fetch(`/api/components/${componentName}`);
            if (!response.ok) {
                throw new Error(`Component ${componentName} not found`);
            }

            const { jsUrl, cssUrl } = await response.json();

            // 2. 加载CSS文件（如果存在）
            if (cssUrl) {
                await this.loadCSS(cssUrl);
            }

            // 3. 动态加载JS文件
            const component = await this.loadJS(jsUrl, componentName);

            return component;
        } catch (error) {
            console.error(`Failed to load component ${componentName}:`, error);
            throw error;
        }
    }

    // 加载CSS文件
    async loadCSS(cssUrl) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    // 加载JS文件并注册组件
    async loadJS(jsUrl, componentName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsUrl;
            script.type = 'text/javascript';

            // 设置全局回调来接收组件定义
            const callbackName = `__component_${componentName}_${Date.now()}`;
            window[callbackName] = (componentDefinition) => {
                // 清理全局回调
                delete window[callbackName];
                document.head.removeChild(script);
                resolve(componentDefinition);
            };

            script.onload = () => {
                // 如果组件没有通过回调注册，尝试从全局对象获取
                if (window[callbackName]) {
                    const component = window[componentName];
                    if (component) {
                        delete window[callbackName];
                        resolve(component);
                    } else {
                        reject(new Error(`Component ${componentName} not found in global scope`));
                    }
                }
            };

            script.onerror = () => {
                delete window[callbackName];
                document.head.removeChild(script);
                reject(new Error(`Failed to load script for ${componentName}`));
            };

            document.head.appendChild(script);
        });
    }

    // 批量加载组件
    async loadComponents(componentNames) {
        const loadPromises = componentNames.map(name => this.loadComponent(name));
        return Promise.all(loadPromises);
    }

    // 注册组件到Vue实例
    registerComponentsToVue(app, components, componentNames) {
        componentNames.forEach((name, index) => {
            app.component(name, components[index]);
        });
    }
}

// 模板渲染器类
class TemplateRenderer {
    constructor(vueApp) {
        this.app = vueApp;
        this.loader = new DynamicComponentLoader();
    }

    // 主要的渲染方法
    async renderTemplate(template, mountElement) {
        try {
            // 1. 解析模板中需要的组件
            const componentNames = this.loader.parseComponentNames(template);
            console.log('Found components:', componentNames);

            // 2. 显示加载状态
            this.showLoading(mountElement);

            // 3. 加载所有需要的组件
            const components = await this.loader.loadComponents(componentNames);
            console.log('All components loaded successfully');

            // 4. 注册组件到Vue应用
            this.loader.registerComponentsToVue(this.app, components, componentNames);

            // 5. 创建动态组件并渲染
            const dynamicComponent = this.createDynamicComponent(template);

            // 6. 挂载组件
            const instance = this.app.mount(mountElement);
            instance.$forceUpdate();

            return instance;
        } catch (error) {
            console.error('Template rendering failed:', error);
            this.showError(mountElement, error.message);
            throw error;
        }
    }

    // 创建动态组件
    createDynamicComponent(template) {
        return {
            template: `<div>${template}</div>`,
            methods: {
                alert(message) {
                    alert(message);
                }
            }
        };
    }

    // 显示加载状态
    showLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = '<div class="loading">正在加载组件...</div>';
        }
    }

    // 显示错误信息
    showError(element, message) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (element) {
            element.innerHTML = `<div class="error">加载失败: ${message}</div>`;
        }
    }
}

// 使用示例
class App {
    constructor() {
        this.vueApp = null;
        this.renderer = null;
        this.init();
    }

    init() {
        // 创建Vue应用实例
        this.vueApp = Vue.createApp({});
        this.renderer = new TemplateRenderer(this.vueApp);
    }

    // 渲染模板的公共方法
    async render(template, mountSelector = '#app') {
        try {
            await this.renderer.renderTemplate(template, mountSelector);
            console.log('Template rendered successfully');
        } catch (error) {
            console.error('Rendering failed:', error);
        }
    }

    // 测试解析功能
    testParsing() {
        const templates = [
            '<XRegion><XButton>测试</XButton></XRegion>',
            '<div><XForm><XInput /><XSelect /></XForm></div>',
            '<XTable :data="list"><template v-slot="{ row }"><XButton @click="edit(row)">编辑</XButton></template></XTable>'
        ];

        templates.forEach((template, index) => {
            console.log(`\n=== 测试模板 ${index + 1} ===`);
            console.log('模板:', template);

            const components = this.renderer.loader.parseComponentNames(template);
            console.log('解析出的组件:', components);
        });
    }
}

// 后台API模拟
class ComponentAPI {
    static components = {
        'XRegion': {
            jsUrl: '/XRegion/index.umd.js',
            cssUrl: '/XRegion/index.css'
        },
        'XButton': {
            jsUrl: '/components/XButton.js',
            cssUrl: '/components/XButton.css'
        },
        'XForm': {
            jsUrl: '/components/XForm.js',
            cssUrl: '/components/XForm.css'
        },
        'XInput': {
            jsUrl: '/components/XInput.js',
            cssUrl: '/components/XInput.css'
        },
        'XSelect': {
            jsUrl: '/components/XSelect.js',
            cssUrl: '/components/XSelect.css'
        },
        'XTable': {
            jsUrl: '/components/XTable.js',
            cssUrl: '/components/XTable.css'
        }
    };

    static async getComponent(componentName) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));

        if (this.components[componentName]) {
            return this.components[componentName];
        } else {
            throw new Error(`Component ${componentName} not found`);
        }
    }
}

// 使用示例
const app = new App();

// 示例模板
const template = `
<XRegion id="r1" title="查询表">
  <XButton type="primary" @click="alert('查询')">查询</XButton>
  <XButton type="default" @click="alert('重置')">重置</XButton>
</XRegion>
`;

// 渲染模板
app.render(template);

// 测试解析功能
app.testParsing();

// 导出供外部使用
export { DynamicComponentLoader, TemplateRenderer, App };