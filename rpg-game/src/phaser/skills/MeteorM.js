// skills/MeteorM.js
import { FireSkillBase } from "./FireSkillBase.js";

export class MeteorM extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);
    const facingX = dir.x >= 0 ? 1 : -1;

    const baseDist = this.base.distance ?? 200;
    const centerX = caster.x + facingX * baseDist;
    const centerY = caster.y;

    const count = this.base.count ?? 4;
    const radius = this.base.radius ?? 75;
    const spread = this.base.spread ?? 55;
    const fallDuration = this.base.fallDuration ?? 360;
    const interval = this.base.interval ?? 130;

    for (let i = 0; i < count; i++) {
      const idx = i - (count - 1) / 2;
      const offsetY = idx * spread;

      const landX = centerX;
      const landY = centerY + offsetY;

      const spawnX = landX - facingX * 220;
      const spawnY = landY - 230;

      scene.time.delayedCall(i * interval, () => {
        const meteor = scene.add.sprite(spawnX, spawnY, "meteor_L");
        if (facingX === -1) meteor.flipX = true;   // ← 추가
        meteor.play("meteor_L");

        scene.tweens.add({
          targets: meteor,
          x: landX,
          y: landY,
          duration: fallDuration,
          onComplete: () => {
            meteor.destroy();

            scene.damageArea({
              x: landX,
              y: landY,
              radius,
              dmg: this.getDamage(),
              onHit: () => this.shakeCameraOnHit(scene),
            });
          },
        });
      });
    }

    scene.textBar = `Meteor M (Lv${this.level})`;
  }
}
