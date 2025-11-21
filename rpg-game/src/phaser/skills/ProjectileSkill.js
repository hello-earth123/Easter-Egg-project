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
    const base = caster.facing.clone().normalize();

    const b = scene.bullets.create(
      caster.x + base.x * 20,
      caster.y + base.y * 20,
      "fireflame"
    );
    b.setVelocity(base.x * this.base.speed, base.y * this.base.speed);
    b.damage = this.getDamage();

    /** 기본 방향 : 우측 */
    b.rotation = Phaser.Math.DegToRad(-90);
    // 좌측
    if (base.x == -1 && base.y == 0) {
      b.flipY = true;
    }
    // 상측
    else if (base.x == 0 && base.y == -1) {
      b.rotation = Phaser.Math.DegToRad(-180);
    }
    // 하측
    else if (base.x == 0 && base.y == 1) {
      b.rotation = Phaser.Math.DegToRad(0);
    }

    b.play('fire-shot');
    b.on('animationcomplete', () => b.destroy());
    b.setAlpha(1);

    scene.textBar = `투사체 (Lv${this.level})`;
  }
}
