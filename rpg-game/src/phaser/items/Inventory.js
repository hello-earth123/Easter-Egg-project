// 전체 item DB 가져온 뒤, 싱글톤으로 따로 가지고 다니다가 습득 시 해당 아이템에 맞춰 가져옴

/** Item ID에 맞춰 Item 정보 반환 - TODO */
export function resolveDropItem(drop) {
  return fetch(`http://127.0.0.1:8000/api/item/${drop.itemName}/`)
    .then(res => { return res.json(); })
    .then(data => {
      const { name, effect } = data;
      return {
        name,
        effect,
        count: 1,
        icon: `static/assets/${name}.png`
      };
    });
}

/** Inventory Use */
export function useItemFromInventory(state, invIndex) {
  const item = state.inventoryData.inventory.items[invIndex];
  if (!item) return;  // 없으면 종료

  item.count -= 1;

  if (item.name === 'hpPotion') {
    state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + (state.playerStats.maxHp * item.effect))
  }
  else if (item.name == 'mpPotion') {
    state.playerStats.mp = Math.min(state.playerStats.maxMp, state.playerStats.mp + (state.playerStats.maxMp * item.effect))
  }

  // 전부 사용했을 경우, 슬롯에서 제거
  if (item.count <= 0) state.inventoryData.inventory.items.splice(invIndex, 1);

  state.textBar = `${item.name} 사용`;
}

let invenInstance = null;

class InventoryData {
  constructor(data) {
    if (invenInstance) {
      return invenInstance;
    }

    this.inventory = { items: data.invenItem } || { items: [] };

    if (!data.invenItem) {
      this.inventory.items.push(
        {
          name: "hpPotion",
          icon: "static/assets/hpPotion.png",
          count: 2,
          effect: 0.3,
        },
        {
          name: "mpPotion",
          icon: "static/assets/mpPotion.png",
          count: 1,
          effect: 0.2,
        }
      );
    }

    invenInstance = this;
  }
}

async function fetchInvenData(userId) {
  const res = await fetch(`http://127.0.0.1:8000/api/inventory/${userId}/`);
  if (!res.ok) throw new Error("Failed to fetch inventory data");
  return await res.json();
}

export async function initInventory(userId) {
  if (invenInstance) {
    return invenInstance;
  }

  try {
    const data = await fetchInvenData(userId);
    return new InventoryData(data);
  } catch (err) {
    console.error(err);
    return null;
  }
}