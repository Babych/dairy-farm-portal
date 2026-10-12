// Farms Management & Database Switching Module
import { store } from '../state/store.js';
import { apiRequest } from '../api/client.js';

let isSwitchingFarm = false;

export const farmsModule = {
    async loadFarms() {
        try {
            const savedFarmId = localStorage.getItem("dairy_selected_farm");
            const queryParam = savedFarmId ? `?active_farm_id=${encodeURIComponent(savedFarmId)}` : "";
            const res = await apiRequest(`/api/farms${queryParam}`, { method: 'GET' });
            if (!res) return;
            store.farmsList = res;

            const currentFarm = (savedFarmId && store.farmsList.find(f => f.id === savedFarmId))
                ? store.farmsList.find(f => f.id === savedFarmId)
                : (store.farmsList.find(f => f.is_current) || store.farmsList[0]);

            if (currentFarm && (!savedFarmId || savedFarmId !== currentFarm.id)) {
                store.setSelectedFarm(currentFarm.id);
            }
            return store.farmsList;
        } catch (err) {
            console.warn("Failed to load farms", err);
        }
    },

    async switchFarm(farmId, showToastMsg = true, onSwitchedCallback = null) {
        if (!farmId || isSwitchingFarm) return;
        isSwitchingFarm = true;
        store.setSelectedFarm(farmId);

        try {
            const res = await apiRequest(`/api/farms/switch/${farmId}`, {
                method: 'POST'
            });

            if (res.access_token) {
                store.setToken(res.access_token);
            }
            if (showToastMsg && res.message) {
                store.addToast(res.message);
            }

            await this.loadFarms();
            if (onSwitchedCallback) {
                await onSwitchedCallback();
            }
        } catch (err) {
            store.addToast(err.message, "error");
        } finally {
            isSwitchingFarm = false;
        }
    },

    getCurrentFarm() {
        if (!store.farmsList || store.farmsList.length === 0) return null;
        return store.farmsList.find(f => f.id === store.currentFarmId) ||
               store.farmsList.find(f => f.is_current) ||
               store.farmsList[0];
    }
};
