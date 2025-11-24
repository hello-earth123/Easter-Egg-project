import Phaser from "phaser";
import { Skill } from "./SkillBase.js";

export class ConeSkill extends Skill {
  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  }
  getManaCost() {
    return this.scaledCost(this.base.baseCost);
  }
  cast(scene, caster) {
    const base = caster.facing.clone().normalize();
    const baseAngle = Math.atan2(base.y, base.x);
    const spreadRad = Phaser.Math.DEG_TO_RAD * this.base.spreadDeg;

    for (let i = 0; i < this.base.count; i++) {
      const t = i / (this.base.count - 1) - 0.5;
      const angle = baseAngle + t * spreadRad;
      const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));

      console.log(base)

      const b = scene.bullets.create(
        caster.x + dir.x * 20,
        caster.y + dir.y * 20,
        "waterwave"
      );

      /** 기본 방향 : 우측 */
      // 좌측
      if (base.x == -1 && base.y == 0) {
        b.flipX = true;
      }
      // 상측
      else if (base.x == 0 && base.y == -1) {
        b.rotation = Phaser.Math.DegToRad(270)
      }
      // 하측
      else if (base.x == 0 && base.y == 1) {
        b.rotation = Phaser.Math.DegToRad(90)
      }

      b.play('water-wave');
      b.on('animationcomplete', () => b.destroy());
      b.setAlpha(1);

      b.setVelocity(dir.x * this.base.speed, dir.y * this.base.speed);
      b.damage = this.getDamage();
    }

    scene.textBar = `부채꼴 (Lv${this.level})`;
  }
}
