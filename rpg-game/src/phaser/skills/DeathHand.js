// skills/DeathHand.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class DeathHand extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;
    const radius = this.base.radius;

    const fx = scene.add.sprite(ox, oy, "deathhand");

    fx.setOrigin(0.5);
    fx.setScale(this.base.scale ?? 1.25);
    applyVFX(scene, fx, this.base.vfx);

    fx.flipX = dir.x < 0;

    const frameTime = 1000 / 14;
    const hitFrames = [0, 11];
    const skipFrames = [15, 16, 17];

    let currentFrame = 0;
    let isDestroying = false;

    const safeDestroy = () => {
      if (isDestroying) return;
      isDestroying = true;
      fx.setVisible(false);
      scene.time.delayedCall(0, () => fx.destroy());
    };

    const applyFrame = () => {
      if (!fx || isDestroying) return;

      if (skipFrames.includes(currentFrame)) {
        currentFrame++;
        return;
      }

      fx.setFrame(currentFrame);

      if (hitFrames.includes(currentFrame)) {
        scene.damageArea({
          x: ox,
          y: oy,
          radius,
          dmg: this.getDamage(),
          onHit: () => this.shakeCameraOnHit(scene)
        });
      }

      currentFrame++;
    };

    const timer = scene.time.addEvent({
      delay: frameTime,
      loop: true,
      callback: applyFrame,
    });

    const fxDuration = frameTime * 20;

    scene.time.delayedCall(fxDuration, () => {
      if (timer) timer.remove(false);
      safeDestroy();
    });

    scene.textBar = `Death Hand (Lv${this.level})`;
  }
}
