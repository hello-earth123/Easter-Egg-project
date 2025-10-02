import { calcNextExp } from "../config/Config.js";

export class PlayerStats {
  constructor() {
    this.level = 1;
    this.exp = 0;
    this.nextExp = calcNextExp(this.level);
    this.maxHp = 120; this.hp = 120;
    this.maxMp = 60;  this.mp = 60;
    this.skillPoints = 0;
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
  }
}
