// Main Application Entry Point with Petite-Vue Initialization
import { createApp, reactive } from '../lib/petite-vue.es.js';
import { store } from './state/store.js';
import { farmsModule } from './modules/farms.js';
import { herdModule } from './modules/herd.js';
import { dashboardModule } from './modules/dashboard.js';
import { flushOfflineOutbox } from './api/client.js';

// Expose on window for easy interoperability with existing modal handlers and onclick scripts
window.store = store;
window.farmsModule = farmsModule;
window.herdModule = herdModule;
window.dashboardModule = dashboardModule;

export function initApp() {
    createApp({
        store,
        farms: farmsModule,
        herd: herdModule,
        dashboard: dashboardModule,

        // Top Navigation
        switchTab(tabName) {
            store.currentTab = tabName;
            const contents = ['tabAnimals', 'tabGrid', 'tabActions', 'tabMeds', 'tabUsers', 'tabMetrics', 'tabLogs'];
            contents.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            const tabMap = {
                'animals': 'tabAnimals',
                'grid': 'tabGrid',
                'actions': 'tabActions',
                'meds': 'tabMeds',
                'users': 'tabUsers',
                'metrics': 'tabMetrics',
                'logs': 'tabLogs'
            };

            const targetId = tabMap[tabName];
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.remove('hidden');

            document.querySelectorAll('.nav-tab-btn').forEach(b => {
                b.classList.remove('active', 'bg-emerald-600', 'text-white', 'shadow-sm');
                b.classList.add('bg-slate-100', 'text-slate-700');
            });
            const activeBtn = document.querySelector(`[onclick*="switchTab('${tabName}')"]`);
            if (activeBtn) {
                activeBtn.classList.add('active', 'bg-emerald-600', 'text-white', 'shadow-sm');
                activeBtn.classList.remove('bg-slate-100', 'text-slate-700');
            }
        },

        // Fast Status Filter
        filterByStatus(statusKey) {
            this.switchTab('animals');
            if (herdModule.statusFilter === statusKey) {
                herdModule.setStatusFilter('ALL');
            } else {
                herdModule.setStatusFilter(statusKey);
            }
        },

        mounted() {
            flushOfflineOutbox();
        }
    }).mount('#petiteAppRoot');
}
