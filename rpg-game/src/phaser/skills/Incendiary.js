// skills/Incendiary.js
import { FireSkillBase } from "./FireSkillBase.js";

export class Incendiary extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    scene.time.addEvent({
      delay: this.base.tickInterval,
      repeat: this.base.duration / this.base.tickInterval,
      callback: () => {
        const fx = scene.add.sprite(
          caster.x + dir.x * 40,
          caster.y + dir.y * 40,
          "incendiary"
        ).play("incendiary");

        fx.on("animationcomplete", () => fx.destroy());

        scene.damageCone({
          caster,
          dir,
          angle: this.base.angle,
          radius: this.base.range,
          dmg: this.base.tickDmg,
          onHit: () => this.shakeCameraOnHit(scene)
        });
      }
    });

    scene.textBar = `Incendiary (Lv${this.level})`;
  }
}