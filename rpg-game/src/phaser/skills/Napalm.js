// skills/Napalm.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class Napalm extends FireSkillBase {
  cast(scene, caster, level) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 150;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const radius = this.base.radius;
    const tickDmg = this.base.tickDmg;
    const duration = this.base.duration;
    const interval = this.base.interval ?? 450;

    // ================ 1) 초기 폭발 =====================
    const boom = scene.add.sprite(ox, oy, "napalm");
    boom.setOrigin(0.5);

    // scale, VFX 통일 적용
    boom.setScale(this.base.scale ?? 1.2);
    applyVFX(scene, boom, this.base.vfx);

    boom.play("napalm");

    // 즉발 데미지
    scene.damageArea({
      x: ox,
      y: oy,
      radius: this.getScaledRadius(radius),
      dmg: this.getDamage(level),
      collectTargets: true,
      onHit: () => this.shakeCameraOnHit(scene)
    });

    // ================ 2) 장판 생성 =====================
    boom.once("animationcomplete", () => {
      boom.destroy();

      const flame = scene.add.sprite(ox, oy, "napalm_flame");
      flame.setOrigin(0.5);

      flame.setScale(this.base.flameScale ?? 2.0);
      applyVFX(scene, flame, this.base.flameVfx);

      flame.play({
        key: "napalm_flame",
        repeat: -1,
        frameRate: 18,
      });

      // duration 후 fade-out
      scene.time.delayedCall(duration, () => {
        scene.tweens.add({
          targets: flame,
          alpha: 0,
          duration: 300,
          onComplete: () => flame.destroy()
        });
      });
    });

    // ================ 3) 지속 데미지 =====================
    const ticks = Math.floor(duration / interval);

    for (let i = 1; i <= ticks; i++) {
      scene.time.delayedCall(i * interval, () => {
        scene.damageArea({
          x: ox,
          y: oy,
          radius: this.getScaledRadius(radius),
          dmg: tickDmg,
          collectTargets: true,
          onHit: () => this.shakeCameraOnHit(scene)
        });
      });
    }
  }
}
