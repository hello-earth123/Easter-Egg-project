import { calcNextExp } from "../config/Config.js";

let playerInstance = null;

// 플레이어 성장 곡선 (비선형: 지수 성장)
const growthHpPerLevel = 1.1;   // 기존보다 10% 증가 → 중후반 체력 안정
const growthMpPerLevel = 1.05;   // 기존보다 소폭 증가

// 공격력 자동 성장 (레벨업 기반)
const growthDamagePerLevel = 3.0; // 레벨 1당 +3 (중후반 체감 상승)

// =============================================================
// PlayerStats
// =============================================================
export class PlayerStats {
  constructor(data) {
    if (playerInstance) {
      return playerInstance;
    }

    this.level = data.level || 1;
    this.exp = data.exp || 0;
    this.nextExp = calcNextExp(this.level);

    this.maxHp = data.maxHP || 100;
    this.hp = data.currentHP || this.maxHp;
    this.maxMp = data.maxMP || 70;
    this.mp = data.currentMP || this.maxMp;

    // 기존 staffDamage → baseDamage 로 승격 (레벨 성장 대상)
    this.baseDamage = (this.level - 1) * growthDamagePerLevel;

    // 기존 damage 는 버튼 스탯 (0~50 유지)
    this.damage = data.staffDamage || 0;

    this.cooldown = data.staffCoolReduce || 0;
    this.manaCost = data.staffManaReduce || 0;
    this.defense = data.staffDefense || 0;
    this.luck = data.staffLuk || 0;

    this.point = (this.level * 2) - (this.damage + this.cooldown + this.manaCost + this.defense + this.luck);
    this.maxPoint = 100;

    // 버프에 의한 데미지 및 마나 소모량 증가
    this.damageMultiplier = 1.0;
    this.manaCostMultiplier = 1.0;

    // 젬
    this.damageGem = data.damageGem || 0;
    this.cooldownGem = data.CoolReduceGem || 0;
    this.manaCostGem = data.manaReduceGem || 0;
    this.defenseGem = data.defenseGem || 0;
    this.luckGem = data.lukGem || 0;

    this.totalGem =
      this.damageGem +
      this.cooldownGem +
      this.manaCostGem +
      this.defenseGem +
      this.luckGem;

    this.maxGem = 20;

    this.nowLocation = data.nowLocation || NaN;

    this.skillPoints = 0;

    this.cutScene = data.point;

    playerInstance = this;
  }

  // =============================================================
  //  BUFF API
  // =============================================================
  applyBuff({ damageMultiplier = 1.0, manaCostMultiplier = 1.0 }) {
    this.damageMultiplier *= damageMultiplier;
    this.manaCostMultiplier *= manaCostMultiplier;
  }

  clearBuff({ damageMultiplier = 1.0, manaCostMultiplier = 1.0 }) {
    this.damageMultiplier /= damageMultiplier;
    this.manaCostMultiplier /= manaCostMultiplier;
  }


  // =============================================================
  // EXP & LEVEL
  // =============================================================
  addExp(amount) {
    if (this.level < 50) {
      this.exp += amount;
      while (this.exp >= this.nextExp) {
        this.exp -= this.nextExp;
        this.levelUp();
      }
    }
  }

  levelUp() {
    if (this.level < 50) {
      this.level++;
      this.nextExp = calcNextExp(this.level);

      // HP / MP 성장
      this.maxHp = Math.floor(this.maxHp * growthHpPerLevel);
      this.maxMp = Math.floor(this.maxMp * growthMpPerLevel);
      this.hp = this.maxHp;
      this.mp = this.maxMp;

      // 레벨업 기반 공격력 증가 (상한 없음)
      this.baseDamage += growthDamagePerLevel;

      if (this.level % 2 == 0) {
        // 스킬 포인트
        this.skillPoints += 1;
      }


      // 스탯 포인트 2 지급
      this.point += 2;
    }
    else {
      this.exp = 0;
    }
  }

  // =============================================================
  // 스탯 소비 로직 (기존 유지)
  // =============================================================
  consume(target, point) {
    if (target === "hp") {
      playerInstance.hp = Math.min(
        playerInstance.maxHp,
        playerInstance.hp + point * playerInstance.maxHp
      );
    } else if (target === "mp") {
      playerInstance.mp = Math.min(
        playerInstance.maxMp,
        playerInstance.mp + point * playerInstance.maxMp
      );
    } else {
      // 버튼 스탯은 기존대로 maxGem 루트 유지
      playerInstance[target] = Math.min(
        playerInstance.maxGem,
        playerInstance[target] + point
      );

      playerInstance.totalGem =
        playerInstance.damageGem +
        playerInstance.cooldownGem +
        playerInstance.manaCostGem +
        playerInstance.defenseGem +
        playerInstance.luckGem;
    }
  }
}

// =============================================================
// 외부 함수
// =============================================================
async function fetchPlayerData(userId) {
  const res = await fetch(`http://121.162.159.56:8000/api/player/${userId}/`);
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

// =============================================================
// 스탯 증가 & 초기화 (UI 버튼용) — 기존 유지
// =============================================================
export function increaseStat(key) {
  // 사용 가능한 스탯 포인트 없으면 바로 리턴
  if (playerInstance.point <= 0) {
    console.log("no stat points left");
    return;
  }

  playerInstance[key]++;
  playerInstance.point--;
  console.log(
    `Stat increased: ${key}=${playerInstance[key]}, remaining point=${playerInstance.point}`
  );
}

export function resetStat() {
  let tmpPoint = 0;

  tmpPoint =
    playerInstance.damage +
    playerInstance.cooldown +
    playerInstance.manaCost +
    playerInstance.defense +
    playerInstance.luck;


  if (tmpPoint == 0) {
    return;
  }

  playerInstance.point += tmpPoint;

  playerInstance.damage = 0;
  playerInstance.cooldown = 0;
  playerInstance.manaCost = 0;
  playerInstance.defense = 0;
  playerInstance.luck = 0;
}
