// skills/MeteorL.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class MeteorL extends FireSkillBase {
  cast(scene, caster, level) {
    const dir = this.getDir(caster);
    const facingX = dir.x >= 0 ? 1 : -1;

    const baseDist = this.base.distance ?? 220;
    const centerX = caster.x + facingX * baseDist;
    const centerY = caster.y;

    const count = this.base.count ?? 6;
    const radius = this.base.radius ?? 90;
    const spread = this.base.spread ?? 65;
    const fallDuration = this.base.fallDuration ?? 400;
    const interval = this.base.interval ?? 120;

    for (let i = 0; i < count; i++) {
      const idx = i - (count - 1) / 2;
      const offsetY = idx * spread;

      const landX = centerX;
      const landY = centerY + offsetY;

      const spawnX = landX - facingX * 240;
      const spawnY = landY - 240;

      scene.time.delayedCall(i * interval, () => {
        // 모든 메테오 스킬과 동일하게 meteor_L 스프라이트 사용
        const meteor = scene.add.sprite(spawnX, spawnY, "meteor_L");
        meteor.setOrigin(0.5);

        // Meteor_S 스타일과 맞춰서 scale + VFX 적용
        const scale = this.base.scale ?? 1.4;   // L이니 S/M보다 약간 크게
        meteor.setScale(scale);
        applyVFX(scene, meteor, this.base.vfx);

        if (facingX === -1) meteor.flipX = true;

        meteor.play("meteor_L");

        scene.tweens.add({
          targets: meteor,
          x: landX,
          y: landY,
          duration: fallDuration,
          ease: "Quad.easeIn",       // Meteor_S와 동일한 낙하 느낌
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
          },
        });
      });
    }
  }
}
