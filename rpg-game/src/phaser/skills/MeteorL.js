// skills/MeteorS.js
import { FireSkillBase } from "./FireSkillBase.js";

export class MeteorL extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const bx = caster.x + dir.x * this.base.distance;
    const by = caster.y + dir.y * this.base.distance;

    for (let i = 0; i < 2; i++) {
      scene.time.delayedCall(i * 120, () => {
        const m = scene.add.sprite(bx, by - 200, "meteor_L").play("meteor_L");

        scene.tweens.add({
          targets: m,
          y: by,
          duration: 300,
          onComplete: () => {
            m.destroy();
            scene.damageArea({
              x: bx,
              y: by,
              radius: this.base.radius,
              dmg: this.getDamage(),
              onHit: () => this.shakeCameraOnHit(scene)
            });
          }
        });
      });
    }

    scene.textBar = `Meteor L (Lv${this.level})`;
  }
}