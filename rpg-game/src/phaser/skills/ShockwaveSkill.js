import { Skill } from "./SkillBase.js";

export class ShockwaveSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    scene.spawnShockwave(caster.x, caster.y, this.base.radius, this.getDamage());
    scene.textBar = `충격파 (Lv${this.level})`;
  }
}
