import Phaser from "phaser";
import { Skill } from "./SkillBase.js";

export class ProjectileSkill extends Skill {
  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  }
  getManaCost() {
    return this.scaledCost(this.base.baseCost);
  }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();

    const b = scene.bullets.create(
      caster.x + dir.x * 20,
      caster.y + dir.y * 20,
      "bullet"
    );
    b.setVelocity(dir.x * this.base.speed, dir.y * this.base.speed);
    b.damage = this.getDamage();

    scene.textBar = `투사체 (Lv${this.level})`;
  }
}
