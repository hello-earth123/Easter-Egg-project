// skills/DeathHand.js
import { FireSkillBase } from "./FireSkillBase.js";

export class DeathHand extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const tx = caster.x + dir.x * this.base.distance;
    const ty = caster.y + dir.y * this.base.distance;

    const hand = scene.add.sprite(tx, ty - 250, "deathhand").play("deathhand");

    scene.tweens.add({
      targets: hand,
      y: ty,
      duration: 250,
      onComplete: () => {
        scene.damageArea({
          x: tx, y: ty,
          radius: this.base.radius,
          dmg: this.getDamage(),
          onHit: () => this.shakeCameraOnHit(scene)
        });
        hand.destroy();
      }
    });

    scene.textBar = `DeathHand (Lv${this.level})`;
  }
}
