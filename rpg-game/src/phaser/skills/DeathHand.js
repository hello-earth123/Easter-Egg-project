// skills/DeathHand.js
import { FireSkillBase } from "./FireSkillBase.js";

export class DeathHand extends FireSkillBase {

  cast(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;
    const radius = this.base.radius;

    const fx = scene.add.sprite(ox, oy, "deathhand");

    // ❗ 좌우 반전
    fx.flipX = dir.x < 0 ? true : false;

    // 프레임 설정
    const frameTime = 1000 / 14;
    const hitFrames = [0, 11];
    const skipFrames = [15, 16, 17];
    const loopStartFrame = 18;

    let currentFrame = 0;
    let isDestroying = false; // ❗ 중요: 파괴 직전 루프 차단

    // 안전 destroy 함수
    const safeDestroy = () => {
      if (isDestroying) return;
      isDestroying = true;

      // ❗ 마지막 0프레임 깜빡임 방지
      fx.setVisible(false);

      // 다음 tick에서 destroy
      scene.time.delayedCall(0, () => {
        if (fx && fx.destroy) fx.destroy();
      });
    };

    const applyFrame = () => {
      if (!fx || isDestroying) return;

      // 스킵 프레임
      if (skipFrames.includes(currentFrame)) {
        currentFrame++;
        return;
      }

      fx.setFrame(currentFrame);

      // 데미지 프레임
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

    // 타이머
    const timer = scene.time.addEvent({
      delay: frameTime,
      loop: true,
      callback: applyFrame,
    });

    // 전체 FX 지속시간
    const fxDuration = frameTime * 40;

    scene.time.delayedCall(fxDuration, () => {
      if (timer) timer.remove(false); // ❗ 루프 중지 (0프레임 다시 나오는 문제 해결)
      safeDestroy();
    });

    scene.textBar = `Death Hand (Lv${this.level})`;
  }
}
