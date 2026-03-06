import api from '../services/api';
import { getOfflineDeliverySheets, removeOfflineDeliverySheet } from './offlineStorage';

export async function syncData() {
    if (!navigator.onLine) return;

    try {
        const sheets = await getOfflineDeliverySheets();
        if (sheets.length === 0) return;

        let syncCount = 0;

        for (const sheet of sheets) {
            try {
                // Remove offline status before sending
                const { status, savedAt, temp_id, ...sheetData } = sheet;

                const response = await api.post('/delivery-sheets', sheetData);

                if (response.status === 200 || response.status === 201) {
                    await removeOfflineDeliverySheet(temp_id);
                    syncCount++;
                } else {
                    console.error(`Failed to sync sheet ${temp_id}: Server responded with ${response.status}`);
                }
            } catch (err) {
                console.error(`Failed to sync sheet ${sheet.temp_id}:`, err);
            }
        }

        if (syncCount > 0) {
            // Dispatch event so UI can show a success message
            window.dispatchEvent(new CustomEvent('offline-sync-success', { detail: { count: syncCount } }));
        }

    } catch (err) {
        console.error('Error in syncData:', err);
    }
}

// Attach listener to trigger automatically when connection is restored
window.addEventListener('online', syncData);
