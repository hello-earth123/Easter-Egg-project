let slotInstance = null;

class EverySlot {
    constructor(data) {
        this.skillSlots = data.skillSlots || [null, null, null, null];
        this.itemShortcutSlots = data.itemSlots || [null, null];
    }
}

async function fetchSlotData(userId) {
    const res = await fetch(`http://127.0.0.1:8000/api/slot/${userId}/`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
}

export async function initSlot(userId) {
    if (slotInstance) {
        return slotInstance;
    }

    try {
        const data = await fetchSlotData(userId);
        return new EverySlot(data);
    }
    catch (err) {
        console.error(err);
        return null;
    }
}