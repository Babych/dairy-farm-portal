// Dashboard, KPIs & Veterinary Action Lists Module
import { store } from '../state/store.js';
import { apiRequest } from '../api/client.js';

export const dashboardModule = {
    stats: {
        total_cows: 0,
        in_quarantine: 0,
        herd_tiles: { open: 0, inseminated: 0, pregnant: 0, dry: 0, fresh: 0 },
        kpis: { avg_dim: 0, conception_rate: 0, pregnancy_rate: 0, insemination_rate: 0, calving_interval_days: 0 }
    },
    actionLists: {
        quarantine_milk: [],
        pregnancy_check: [],
        dry_off_candidates: []
    },

    async loadStats() {
        try {
            const data = await apiRequest('/api/dashboard/stats', { method: 'GET' });
            if (data) {
                this.stats = {
                    total_cows: data.total_cows || 0,
                    in_quarantine: data.in_quarantine || 0,
                    herd_tiles: data.herd_tiles || { open: 0, inseminated: 0, pregnant: 0, dry: 0, fresh: 0 },
                    kpis: data.kpis || { avg_dim: 0, conception_rate: 0, pregnancy_rate: 0, insemination_rate: 0, calving_interval_days: 0 }
                };
            }
        } catch (e) {
            console.error("Load stats error", e);
        }
    },

    async loadActionLists() {
        try {
            const data = await apiRequest('/api/dashboard/action-lists', { method: 'GET' });
            if (data) {
                this.actionLists = {
                    quarantine_milk: data.quarantine_milk || data.milk_quarantine || [],
                    pregnancy_check: data.pregnancy_check || data.pregnancy_check_due || [],
                    dry_off_candidates: data.dry_off_candidates || []
                };
            }
        } catch (e) {
            console.error("Load action lists error", e);
        }
    },

    getPct(val) {
        const total = this.stats.total_cows || 0;
        return total > 0 ? Math.round((val / total) * 100) : 0;
    }
};
