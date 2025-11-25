// 전체 item DB 가져온 뒤, 싱글톤으로 따로 가지고 다니다가 습득 시 해당 아이템에 맞춰 가져옴

/** Item ID에 맞춰 Item 정보 반환 - TODO */
export function resolveDropItem(drop) {
  // TODO: 포션 id 일관성 수정
  if (drop.itemName === "hpPotion")
    return {
      id: "potion_hp",
      name: "HP Potion",
      icon: "assets/item.png",
      count: 1,
      type: "consume",
      effect: { hp: 30 },
    };
  if (drop.itemName === "mpPotion")
    return {
      id: "mana_pot",
      name: "MP Potion",
      icon: "assets/item.png",
      count: 1,
      type: "consume",
      effect: { mp: 20 },
    };
  if (drop.itemName === "lowGem")
    return {
      id: "elixir",
      name: "Elixir",
      icon: "assets/item.png",
      count: 1,
      type: "consume",
      effect: { hp: 50, mp: 30 },
    };
  if (drop.itemName === "midGem")
    return {
      id: "rare_gem",
      name: "Rare Gem",
      icon: "assets/item.png",
      count: 1,
      type: "misc",
    };
  if (drop.itemName === "highGem")
    return {
      id: "rare_gem",
      name: "Rare Gem",
      icon: "assets/item.png",
      count: 1,
      type: "misc",
    };
  return {
    id: drop.id,
    name: drop.name || drop.id,
    icon: "assets/item.png",
    count: 1,
    type: "misc",
  };
}

/** Inventory Use */
export function useItemFromInventory(state, invIndex) {
  const item = state.inventory.items[invIndex];
  // 없으면 종료
  if (!item) return;

  // 소모품일 경우
  if (item.type === "consume") {
    if (item.effect?.hp)
      state.playerStats.hp = Math.min(
        state.playerStats.maxHp,
        state.playerStats.hp + item.effect.hp
      );
    if (item.effect?.mp)
      state.playerStats.mp = Math.min(
        state.playerStats.maxMp,
        state.playerStats.mp + item.effect.mp
      );

    item.count -= 1;

    // 전부 사용했을 경우, 슬롯에서 제거
    if (item.count <= 0) state.inventory.items.splice(invIndex, 1);

    state.textBar = `${item.name} 사용`;
  }
}
