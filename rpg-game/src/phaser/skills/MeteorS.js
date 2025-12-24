// skills/MeteorS.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class MeteorS extends FireSkillBase {

  cast(scene, caster, level) {

    const dir = this.getDir(caster);
    const facingX = dir.x >= 0 ? 1 : -1;

    const baseDist = this.base.distance ?? 180;
    const centerX = caster.x + facingX * baseDist;
    const centerY = caster.y;

    const count = this.base.count ?? 2;
    const radius = this.base.radius ?? 60;
    const spread = this.base.spread ?? 45;
    const fallDuration = this.base.fallDuration ?? 330;
    const interval = this.base.interval ?? 140;

    for (let i = 0; i < count; i++) {

      const idx = i - (count - 1) / 2;
      const offsetY = idx * spread;

      const landX = centerX;
      const landY = centerY + offsetY;

      const spawnX = landX - facingX * 200;
      const spawnY = landY - 220;

      // === 순차 메테오 낙하 ===
      scene.time.delayedCall(i * interval, () => {

        const meteor = scene.add.sprite(spawnX, spawnY, "meteor_L");
        meteor.setOrigin(0.5);

        // scale + VFX 적용
        const scale = this.base.scale ?? 1.2;
        meteor.setScale(scale);
        applyVFX(scene, meteor, this.base.vfx);

        if (facingX === -1) meteor.flipX = true;

        meteor.play("meteor_L");

        scene.tweens.add({
          targets: meteor,
          x: landX,
          y: landY,
          duration: fallDuration,
          ease: "Quad.easeIn",
          onComplete: () => {
            meteor.destroy();

            scene.damageArea({
              x: landX,
              y: landY,
              radius: this.getScaledRadius(radius),
              dmg: this.getDamage(level),
              collectTargets: true,
              onHit: () => this.shakeCameraOnHit(scene),
            });
          }
        });
      });
    }
  }
}
