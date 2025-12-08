// 전체 item DB 가져온 뒤, 싱글톤으로 따로 가지고 다니다가 습득 시 해당 아이템에 맞춰 가져옴
const items = {
        hpPotion: 'HP 포션',
        mpPotion: 'MP 포션',
        damageGemLow: '하급 보석 (데미지)',
        damageGemMid: '중급 보석 (데미지)',
        damageGemHigh: '상급 보석 (데미지)',
        damageGemSuper: '특급 보석 (데미지)',
        cooldownGemLow: '하급 보석 (쿨타임)',
        cooldownGemMid: '중급 보석 (쿨타임)',
        cooldownGemHigh: '상급 보석 (쿨타임)',
        cooldownGemSuper: '특급 보석 (쿨타임)',
        manaCostGemLow: '하급 보석 (마나 소모)',
        manaCostGemMid: '중급 보석 (마나 소모)',
        manaCostGemHigh: '상급 보석 (마나 소모)',
        manaCostGemSuper: '특급 보석 (마나 소모)',
        defenseGemLow: '하급 보석 (방어력)',
        defenseGemMid: '중급 보석 (방어력)',
        defenseGemHigh: '상급 보석 (방어력)',
        defenseGemSuper: '특급 보석 (방어력)',
        luckGemLow: '하급 보석 (행운)',
        luckGemMid: '중급 보석 (행운)',
        luckGemHigh: '상급 보석 (행운)',
        luckGemSuper: '특급 보석 (행운)',
}

/** Item ID에 맞춰 Item 정보 반환 - TODO */
export function resolveDropItem(drop) {
  return fetch(`http://127.0.0.1:8000/api/item/${drop.itemName}/`)
    .then(res => { return res.json(); })
    .then(data => {
      const { name, effect } = data;
      console.log(name);
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
    state.playerStats.consume('hp', item.effect);
  }
  else if (item.name == 'mpPotion') {
    state.playerStats.consume('mp', item.effect);
  }
  else if (item.name.includes('Gem')){
    console.log(state.playerStats.totalGem);
    if (state.playerStats.totalGem < state.playerStats.maxGem){
      if (item.name.includes('damage')){
        state.playerStats.consume('damageGem', item.effect);
      }
      else if (item.name.includes('cooldown')){
        state.playerStats.consume('cooldownGem', item.effect);
      }
      else if (item.name.includes('manaCost')){
        state.playerStats.consume('manaCostGem', item.effect);
      }
      else if (item.name.includes('defense')){
        state.playerStats.consume('defenseGem', item.effect);
      }
      else{
        state.playerStats.consume('luckGem', item.effect);
      }
    }
    else{
      item.count += 1;
      state.textBar = `최대 추가 스탯 초과! 사용 불가!`;
      return;
    }
  }

  console.log(item);
  // 전부 사용했을 경우, 슬롯에서 제거
  if (item.count <= 0) state.inventoryData.inventory.items.splice(invIndex, 1);

  state.textBar = `${items[item.name]} 사용`;
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