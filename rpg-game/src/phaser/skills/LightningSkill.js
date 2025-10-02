import { Skill } from "./SkillBase.js";

export class LightningSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }

  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const tx = caster.x + dir.x * this.base.range;
    const ty = caster.y + dir.y * this.base.range;

    // 🔒 안전 실행 (판정은 Effects.js 내부에서 안전 처리)
    scene.spawnLightning(tx, ty, this.base.radius, this.getDamage());
    scene.textBar = `낙뢰 (Lv${this.level})`;
  }
}
