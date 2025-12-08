// skills/FlameC.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class FlameC extends FireSkillBase {

  cast(scene, caster) {

    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 80;
    const spread = this.base.spread ?? 60;
    const radius = this.base.radius ?? 70;
    const duration = this.base.duration ?? 1200;
    const tickDmg = this.base.tickDmg ?? 12;
    const scale = this.base.scale ?? 1.3;

    // ======================================================
    // 🔥 1) 중심 폭발 위치 (플레이어 앞 distance)
    // ======================================================
    const centerX = caster.x + dir.x * dist;
    const centerY = caster.y + dir.y * dist;

    // ======================================================
    // 🔥 2) 중심 폭발 + 십자 주변 지점
    // ======================================================
    const positions = [
      { x: centerX,             y: centerY             }, // 중심 폭발
      { x: centerX - spread,    y: centerY             }, // 왼쪽
      { x: centerX + spread,    y: centerY             }, // 오른쪽
      { x: centerX,             y: centerY - spread    }, // 위
      { x: centerX,             y: centerY + spread    }, // 아래
    ];

    // ======================================================
    // 🔥 FX 생성
    // ======================================================
    const flames = [];

    for (const pos of positions) {
      const fx = scene.add.sprite(pos.x, pos.y, "flameC");
      fx.setOrigin(0.5);
      fx.setScale(scale);
      applyVFX(scene, fx, this.base.vfx);

      fx.play("flameC");

      flames.push({ fx, x: pos.x, y: pos.y });
    }

    // ======================================================
    // 🔥 즉발 데미지
    // ======================================================
    for (const f of flames) {
      scene.damageArea({
        x: f.x,
        y: f.y,
        radius,
        dmg: this.getDamage(),
        onHit: () => this.shakeCameraOnHit(scene),
      });
    }

    // ======================================================
    // 🔥 지속 도트 (7틱)
    // ======================================================
    const interval = duration / 7;
    for (const f of flames) {
      scene.applyDotArea({
        x: f.x,
        y: f.y,
        radius: radius,
        tickDmg: tickDmg,
        duration: duration,
        interval: interval,
      });
    }


    // ======================================================
    // 🔥 안전 destroy
    // ======================================================
    for (const f of flames) {
      f.fx.once("animationcomplete", () => {
        f.fx.setVisible(false);
        scene.time.delayedCall(0, () => f.fx.destroy?.());
      });
    }

    scene.textBar = `Flame C (Lv${this.level})`;
  }
}
