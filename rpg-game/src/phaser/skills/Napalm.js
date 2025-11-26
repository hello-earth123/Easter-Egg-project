// skills/Napalm.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Napalm extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const tx = caster.x + dir.x * this.base.distance;
    const ty = caster.y + dir.y * this.base.distance;

    const fx = scene.add.sprite(tx, ty, "napalm").play("napalm");
    scene.time.delayedCall(this.base.duration, () => fx.destroy());

    scene.applyPersistentDot({
      x: tx, y: ty,
      radius: this.base.radius,
      tickDmg: this.base.tickDmg,
      duration: this.base.duration,
    });

    scene.textBar = `Napalm (Lv${this.level})`;
  }
}
