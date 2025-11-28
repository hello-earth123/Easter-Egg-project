// skills/FlameB.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class FlameB extends FireSkillBase {

  cast(scene, caster) {

    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 80;
    const radius = this.base.radius ?? 60;
    const duration = this.base.duration ?? 1200;
    const tickDmg = this.base.tickDmg ?? 10;

    // ===== 🔥 1타: 기본 위치 =====
    const ox1 = caster.x + dir.x * dist;
    const oy1 = caster.y + dir.y * dist;

    const fx1 = scene.add.sprite(ox1, oy1, "flameB");
    fx1.setOrigin(0.5);

    // === scale 적용 ===
    const scale = this.base.scale ?? 1.3;
    fx1.setScale(scale);

    // === VFX 적용 ===
    applyVFX(scene, fx1, this.base.vfx);

    // === 애니메이션 시작 ===
    fx1.play("flameB");

    // 즉발 데미지
    scene.damageArea({
      x: ox1,
      y: oy1,
      radius,
      dmg: this.getDamage(),
      onHit: () => this.shakeCameraOnHit(scene)
    });

    // ===== 🔥 2타: 전방에 추가 타격 =====
    const ox2 = caster.x + dir.x * (dist + 50);
    const oy2 = caster.y + dir.y * (dist + 50);

    const fx2 = scene.add.sprite(ox2, oy2, "flameB");
    fx2.setOrigin(0.5);

    fx2.setScale(scale);
    applyVFX(scene, fx2, this.base.vfx);

    fx2.play("flameB");

    // 즉발 데미지 (두 번째 위치)
    scene.damageArea({
      x: ox2,
      y: oy2,
      radius,
      dmg: this.getDamage(),
      onHit: () => this.shakeCameraOnHit(scene)
    });

    // ===== 🔥 도트 데미지 =====
    const interval = duration / 2;
    for (let i = 1; i <= 2; i++) {
      scene.time.delayedCall(i * interval, () => {

        // 1타 dot
        scene.damageArea({
          x: ox1,
          y: oy1,
          radius,
          dmg: tickDmg,
          onHit: () => this.shakeCameraOnHit(scene)
        });

        // 2타 dot
        scene.damageArea({
          x: ox2,
          y: oy2,
          radius,
          dmg: tickDmg,
          onHit: () => this.shakeCameraOnHit(scene)
        });

      });
    }

    // ===== 🔥 애니메이션 종료 후 safe destroy =====
    fx1.once("animationcomplete", () => {
      fx1.setVisible(false);
      scene.time.delayedCall(0, () => fx1.destroy?.());
    });

    fx2.once("animationcomplete", () => {
      fx2.setVisible(false);
      scene.time.delayedCall(0, () => fx2.destroy?.());
    });

    scene.textBar = `Flame B (Lv${this.level})`;
  }
}
