// Herd & Animals Management Module
import { store } from '../state/store.js';
import { apiRequest } from '../api/client.js';

export const herdModule = {
    animals: [],
    totalCount: 0,
    searchQuery: '',
    statusFilter: 'ALL',
    curOffset: 0,
    pageLimit: 50,
    isLoading: false,

    async loadAnimals() {
        this.isLoading = true;
        try {
            let url = `/api/animals?limit=${this.pageLimit}&offset=${this.curOffset}`;
            if (this.searchQuery) {
                url += `&q=${encodeURIComponent(this.searchQuery)}`;
            }
            if (this.statusFilter && this.statusFilter !== 'ALL') {
                url += `&status=${encodeURIComponent(this.statusFilter)}`;
            }

            const data = await apiRequest(url, { method: 'GET' });
            if (data) {
                this.animals = data.items || [];
                this.totalCount = data.total || 0;
            }
        } catch (err) {
            console.error("Load animals error", err);
            store.addToast("Не вдалося завантажити список тварин", "error");
        } finally {
            this.isLoading = false;
        }
    },

    debounceTimer: null,
    onSearchInput(val) {
        this.searchQuery = val;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.curOffset = 0;
            this.loadAnimals();
        }, 300);
    },

    setStatusFilter(status) {
        this.statusFilter = status;
        this.curOffset = 0;
        this.loadAnimals();
    },

    prevPage() {
        if (this.curOffset >= this.pageLimit) {
            this.curOffset -= this.pageLimit;
            this.loadAnimals();
        }
    },

    nextPage() {
        if (this.curOffset + this.pageLimit < this.totalCount) {
            this.curOffset += this.pageLimit;
            this.loadAnimals();
        }
    },

    getStatusBadgeClass(status) {
        switch(status) {
            case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'Pregnant': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
            case 'Dry': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'Inseminated': return 'bg-purple-50 text-purple-700 border border-purple-200';
            case 'Culled': return 'bg-slate-100 text-slate-500 border border-slate-200';
            default: return 'bg-slate-50 text-slate-600';
        }
    }
};
