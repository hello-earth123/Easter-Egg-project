import Phaser from "phaser";
import { Skill } from "./SkillBase.js";

export class DotSkill extends Skill {
  getDamage() {
    return this.base.hitDmg;
  } // 즉시타격은 고정
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
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();

    b.dot = {
      damage: this.base.tickDmg + Math.floor((this.level - 1) * 2),
      duration: this.base.duration,
      interval: this.base.interval,
    };

    scene.textBar = `DOT 투사체 (Lv${this.level})`;
  }
}
