// skills/FireBomb.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FireBomb extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const tx = caster.x + dir.x * this.base.distance;
    const ty = caster.y + dir.y * this.base.distance;

    const fx = scene.add.sprite(tx, ty, "firebomb").play("firebomb");
    fx.on("animationcomplete", () => fx.destroy());

    scene.damageArea({
      x: tx, y: ty,
      radius: this.base.radius,
      dmg: this.getDamage(),
      onHit: () => this.shakeCameraOnHit(scene),
    });

    scene.textBar = `FireBomb (Lv${this.level})`;
  }
}