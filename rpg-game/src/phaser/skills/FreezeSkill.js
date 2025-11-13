import Phaser from "phaser";
import { Skill } from "./SkillBase.js";

export class FreezeSkill extends Skill {
  getDamage() {
    return this.base.hitDmg;
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
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();

    b.onHit = (monster) => {
      monster.isFrozen = true;
      monster.setVelocity(0, 0);
      scene.time.delayedCall(this.base.freezeMs, () => {
        if (monster && monster.active) monster.isFrozen = false;
      });
    };

    scene.textBar = `빙결 투사체 (Lv${this.level})`;
  }
}
