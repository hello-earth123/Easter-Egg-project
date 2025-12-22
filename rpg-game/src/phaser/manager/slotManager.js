let slotInstance = null;

class EverySlot {
    constructor(data) {
        if (slotInstance) {
            return slotInstance;
        }

        this.skillSlots = data.skillSlots || [null, null, null, null];
        this.itemSlots = data.itemSlots || [null, null];

        slotInstance = this;
    }
}

async function fetchSlotData(userId) {
    const res = await fetch(`http://121.162.159.56:8000/api/slot/${userId}/`);
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