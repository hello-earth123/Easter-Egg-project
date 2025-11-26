// skills/FlameA.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FlameA extends FireSkillBase {
  getDamage() { return this.base.hitDmg; }

  cast(scene, caster) {
    const dir = this.getDir(caster);
    const tx = caster.x + dir.x * this.base.distance;
    const ty = caster.y + dir.y * this.base.distance;

    const fx = scene.add.sprite(tx, ty, "flameA").play("flameA");
    fx.on("animationcomplete", () => fx.destroy());

    scene.applyDotArea({
      x: tx, y: ty,
      radius: this.base.radius,
      tickDmg: this.base.tickDmg,
      duration: this.base.duration
    });

    scene.textBar = `Flame A (Lv${this.level})`;
  }
}