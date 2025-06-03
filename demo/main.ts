import { createApp } from 'vue'
import './style.css'
// import App from './App.vue'
// import App from './pages/vue-repl/VueRefl.vue'
import App from './pages/vue3-sfc-loader/Vue3SfcLoader.vue'
import XUI from "@xin3plat/xui"
const app = createApp(App)
window.app = app
//在这里提前加载远程组件
app.use(XUI)
app.mount('#app')

