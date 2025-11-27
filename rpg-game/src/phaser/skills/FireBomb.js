// skills/FireBomb.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FireBomb extends FireSkillBase {
  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  }

  cast(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 140;
    const x = caster.x + dir.x * dist;
    const y = caster.y + dir.y * dist;

    const fx = scene.add.sprite(x, y, "firebomb");
    fx.play("firebomb");

    const radius = this.base.radius ?? 100;
    const dmg = this.getDamage();

    let damageApplied = false;

    fx.on("animationupdate", (_, frame) => {
      // 정확히 9프레임에서만 딱 한 번 터짐
      if (!damageApplied && frame.index === 9) {
        scene.damageArea({
          x,
          y,
          radius,
          dmg,
          onHit: () => this.shakeCameraOnHit(scene),
        });
        damageApplied = true;
      }
    });

    fx.on("animationcomplete", () => fx.destroy());

    scene.textBar = `Fire Bomb (Lv${this.level})`;
  }
}
