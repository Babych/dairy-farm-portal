declare module '*/lib/petite-vue.es.js' {
    export function createApp(initialData?: any): {
        mount(el?: string | Element): any;
    };
    export function reactive<T extends object>(target: T): T;
}
