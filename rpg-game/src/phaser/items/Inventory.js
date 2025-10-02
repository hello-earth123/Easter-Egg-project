// 드롭 해석 / 인벤 사용

export function resolveDropItem(drop) {
  if (drop.id === "potion_hp") return { id: "potion_hp", name: "HP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 30 } };
  if (drop.id === "mana_pot")  return { id: "mana_pot",  name: "MP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { mp: 20 } };
  if (drop.id === "elixir")    return { id: "elixir",    name: "Elixir",    icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 50, mp: 30 } };
  if (drop.id === "rare_gem")  return { id: "rare_gem",  name: "Rare Gem",  icon: "assets/item.png", count: 1, type: "misc" };
  return { id: drop.id, name: drop.name || drop.id, icon: "assets/item.png", count: 1, type: "misc" };
}

export function useItemFromInventory(state, invIndex) {
  const item = state.inventory.items[invIndex];
  if (!item) return;
  if (item.type === "consume") {
    if (item.effect?.hp) state.playerStats.hp = Math.min(state.playerStats.maxHp, state.playerStats.hp + item.effect.hp);
    if (item.effect?.mp) state.playerStats.mp = Math.min(state.playerStats.maxMp, state.playerStats.mp + item.effect.mp);
    item.count -= 1;
    if (item.count <= 0) state.inventory.items.splice(invIndex, 1);
    state.textBar = `${item.name} 사용`;
  }
}
