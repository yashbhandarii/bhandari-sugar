import Dexie from 'dexie';

export const db = new Dexie('BhandariSugarDB');

db.version(1).stores({
    deliverySheets: '++id, &temp_id, status, date',
    customers: '++id, name, mobile',
    stock: '++id, item_name'
});

// Helper functions for offline sheets
export async function saveSheetOffline(sheet) {
    return await db.deliverySheets.put({
        ...sheet,
        temp_id: sheet.temp_id || crypto.randomUUID(),
        status: 'offline_pending',
        savedAt: new Date().toISOString()
    });
}

export async function getOfflineSheets() {
    return await db.deliverySheets.toArray();
}

export async function deleteOfflineSheet(id) {
    return await db.deliverySheets.delete(id);
}
