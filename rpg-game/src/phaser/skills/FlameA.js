// skills/FlameA.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class FlameA extends FireSkillBase {

  cast(scene, caster) {

    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 120;
    const ox = caster.x + dir.x * dist;
    const oy = caster.y + dir.y * dist;

    const radius = this.base.radius ?? 60;
    const duration = this.base.duration ?? 1200;
    const tickDmg = this.base.tickDmg ?? 8;

    // === 🔥 FlameA 스프라이트 생성 ===
    const fx = scene.add.sprite(ox, oy, "flameA");
    fx.setOrigin(0.5);

    // === 🔥 scale 적용 (Config.js) ===
    const scale = this.base.scale ?? 1.2;
    fx.setScale(scale);

    // === 🔥 VFX 적용 (flame_pulse) ===
    applyVFX(scene, fx, this.base.vfx);

    // === 🔥 애니메이션 재생 ===
    fx.play("flameA");

    // =====================================
    // 🔥 즉발 데미지
    // =====================================
    scene.damageArea({
      x: ox,
      y: oy,
      radius,
      dmg: this.getDamage(),
      onHit: () => this.shakeCameraOnHit(scene)
    });

    // =====================================
    // 🔥 지속 도트 데미지
    // =====================================
    const interval = duration / 2; // 원본 로직 유지
    for (let i = 1; i <= 2; i++) {
      scene.time.delayedCall(i * interval, () => {
        scene.damageArea({
          x: ox,
          y: oy,
          radius,
          dmg: tickDmg,
          onHit: () => this.shakeCameraOnHit(scene)
        });
      });
    }

    // =====================================
    // 🔥 애니메이션 종료 후 안전 destroy
    // =====================================
    fx.once("animationcomplete", () => {
      fx.setVisible(false);      // 마지막 0프레임 깜빡임 방지
      scene.time.delayedCall(0, () => {
        if (fx && fx.destroy) fx.destroy();
      });
    });

    scene.textBar = `Flame A (Lv${this.level})`;
  }
}
