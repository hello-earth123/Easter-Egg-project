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
  const item = state.inventory.items[invIndex];
  // 없으면 종료
  if (!item) return;

  // // 소모품일 경우
  // if (item.type === "consume") {
  //   if (item.effect?.hp)
  //     state.playerStats.hp = Math.min(
  //       state.playerStats.maxHp,
  //       state.playerStats.hp + item.effect.hp
  //     );
  //   if (item.effect?.mp)
  //     state.playerStats.mp = Math.min(
  //       state.playerStats.maxMp,
  //       state.playerStats.mp + item.effect.mp
  //     );

  item.count -= 1;

  if (item.name === 'hpPotion') {
    state.hp = Math.min(state.maxHp, state.hp + (state.maxHp * item.effect))
  }
  else if (item.name == 'mpPotion') {
    state.mp = Math.min(state.maxMp, state.mp + (state.maxMp * item.effect))
  }

  // 전부 사용했을 경우, 슬롯에서 제거
  if (item.count <= 0) state.inventory.items.splice(invIndex, 1);

  state.textBar = `${item.name} 사용`;
}
