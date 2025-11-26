// skills/Fireball.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Fireball extends FireSkillBase {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }

  cast(scene, caster) {
    const dir = this.getDir(caster);

    const b = scene.bullets.create(
      caster.x + dir.x * 20,
      caster.y + dir.y * 20,
      "fireball"
    );

    b.setVelocity(dir.x * this.base.speed, dir.y * this.base.speed);
    b.damage = this.getDamage();
    b.play("fireball");

    b.onHit = () => this.shakeCameraOnHit(scene);

    scene.textBar = `Fireball (Lv${this.level})`;
  }
}