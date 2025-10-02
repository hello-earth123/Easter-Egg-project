import { CFG } from "../config/Config.js";

export class Skill {
  constructor(key, base) {
    this.key = key;
    this.level = 1;
    this.base = base;
    this.onCooldownUntil = 0;
  }

  levelUp() { this.level += 1; }

  scaledDamage(baseDmg) {
    const mul = 1 + CFG.skillScaling.dmgPerLevel * (this.level - 1);
    return Math.floor(baseDmg * mul);
  }

  scaledCost(baseCost) {
    const mul = 1 + CFG.skillScaling.costPerLevel * (this.level - 1);
    return Math.floor(baseCost * mul);
  }

  canCast(scene) {
    const now = scene.time.now;
    const cost = this.getManaCost();
    if (now < this.onCooldownUntil) { scene.textBar = "쿨다운 중"; return false; }
    if (scene.playerStats.mp < cost) { scene.textBar = "MP 부족"; return false; }
    return true;
  }

  getDamage() { return 0; }
  getManaCost() { return 0; }
  getCooldown() { return this.base.cd || 1000; }

  tryCast(scene, caster) {
    if (!this.canCast(scene)) return;
    const cost = this.getManaCost();
    scene.playerStats.mp = Math.max(0, scene.playerStats.mp - cost);
    this.onCooldownUntil = scene.time.now + this.getCooldown();
    this.cast(scene, caster);
  }

  // override in subclasses: cast(scene, caster) {}
}
