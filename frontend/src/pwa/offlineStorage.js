import { db } from '../services/db';

export async function saveDeliverySheetOffline(sheet) {
    const payload = {
        ...sheet,
        status: 'offline_pending',
        savedAt: new Date().toISOString()
    };
    // Generate temp_id if not present
    if (!payload.temp_id) {
        payload.temp_id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    }

    // Use Dexie to save (put handles both add and update based on primary key or temp_id if defined as key)
    // We'll search for existing temp_id to update or add new
    const existing = await db.deliverySheets.where('temp_id').equals(payload.temp_id).first();
    if (existing) {
        await db.deliverySheets.update(existing.id, payload);
    } else {
        await db.deliverySheets.add(payload);
    }

    return payload;
}

export async function getOfflineDeliverySheets() {
    return await db.deliverySheets.toArray();
}

export async function removeOfflineDeliverySheet(temp_id) {
    const record = await db.deliverySheets.where('temp_id').equals(temp_id).first();
    if (record) {
        await db.deliverySheets.delete(record.id);
    }
}
