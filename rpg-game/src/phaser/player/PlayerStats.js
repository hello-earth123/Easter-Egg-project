import { calcNextExp } from "../config/Config.js";

let playerInstance = null;

export class PlayerStats {
  constructor(data) {
    if (playerInstance) {
      return playerInstance;
    }

    this.level = data.level || 1;
    this.exp = data.exp || 0;
    this.nextExp = calcNextExp(this.level);

    this.maxHp = data.maxHP || 120; this.hp = data.currentHP || 120;
    this.maxMp = data.maxMP || 60; this.mp = data.currentMP || 60;

    this.damage = data.staffDamage || 0;
    this.cooldown = data.staffCoolReduce || 0;
    this.manaCost = data.staffManaReduce || 0;
    this.defense = data.staffDefense || 0;
    this.luck = data.staffLuk || 0;
    this.point = data.point || 0;
    this.maxPoint = 50;

    this.lowGemCount = data.lowGemCount || 0;
    this.midGemCount = data.midGemCount || 0;
    this.highGemCount = data.highGemCount || 0;
    this.superGemCount = data.superGemCount || 0;

    this.nowLocation = data.nowLocation || NaN;

    // tmp
    this.skillPoints = 0;

    playerInstance = this;
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.nextExp = calcNextExp(this.level);
    // 성장: HP/MP 동시 증가 + 스킬 포인트
    this.maxHp += 20;
    this.maxMp += 10;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.skillPoints += 1;
    this.point += 1;
  }
}

async function fetchPlayerData(userId) {
  const res = await fetch(`http://127.0.0.1:8000/api/player/${userId}/`);
  if (!res.ok) throw new Error("Failed to fetch player data");
  return await res.json();
}

export async function initPlayer(userId) {
  if (playerInstance) {
    return playerInstance;
  }

  try {
    const data = await fetchPlayerData(userId);
    return new PlayerStats(data);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function increaseStat(key){
  playerInstance[key]++;
  console.log('player', playerInstance[key]);
}

export function resetStat(){
  playerInstance.damage =  0;
    playerInstance.cooldown =  0;
    playerInstance.manaCost =  0;
    playerInstance.defense = 0;
    playerInstance.luck = 0;
}