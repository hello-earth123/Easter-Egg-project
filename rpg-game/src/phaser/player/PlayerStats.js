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

    this.damageGem = data.damageGem || 0;
    this.cooldownGem = data.CoolReduceGem || 0;
    this.manaCostGem = data.manaReduceGem || 0;
    this.defenseGem = data.defenseGem || 0;
    this.luckGem = data.lukGem || 0;
    this.totalGem = this.damageGem + this.cooldownGem + this.manaCostGem + this.defenseGem + this.luckGem;
    this.maxGem = 20;

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

  consume (target, point){
    if (target == 'hp'){
      playerInstance.hp = Math.min(playerInstance.maxHp, (playerInstance.hp + point * playerInstance.maxHp));
    }
    else if (target == 'mp'){
      playerInstance.mp = Math.min(playerInstance.maxMp, (playerInstance.mp + point * playerInstance.maxMp));
    }
    else{
      playerInstance[target] = Math.min(playerInstance.maxGem, (playerInstance[target] + point));
      playerInstance.totalGem = playerInstance.damageGem + playerInstance.cooldownGem + playerInstance.manaCostGem + playerInstance.defenseGem + playerInstance.luckGem;
      console.log(playerInstance);
    }
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