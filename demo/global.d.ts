// src/global.d.ts
import type { App } from 'vue';

declare global {
    interface Window {
        /**
         * We’re storing our Vue app instance on window.app
         * so that other scripts (or the console) can refer to it.
         */
        app: App<Element>;
    }
}