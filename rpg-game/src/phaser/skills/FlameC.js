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

    // === 🔥 scale 적용 ===
    const scale = this.base.scale ?? 1.4;

    // === 🔥 5개 방향 벡터 (십자 형태) ===
    const dirs = [
      dir,                          // 정면
      { x: -dir.y, y: dir.x },      // 왼쪽 (90° 회전)
      { x: dir.y, y: -dir.x },      // 오른쪽 (-90° 회전)
      { x: 0, y: -1 },              // 위쪽
      { x: 0, y: 1 },               // 아래쪽
    ];

    // === 🔥 spread 길이 보정 ===  
    // 정면은 dist 사용, 좌우는 spread를 반영
    const calcPos = (d) => {
      if (d === dir) {
        return {
          x: caster.x + d.x * dist,
          y: caster.y + d.y * dist
        };
      }
      return {
        x: caster.x + d.x * spread,
        y: caster.y + d.y * spread
      };
    };

    // ======================================================
    // 🔥 FlameC 5개 FX 생성
    // ======================================================
    const flames = [];

    for (const d of dirs) {
      const pos = calcPos(d);

      const fx = scene.add.sprite(pos.x, pos.y, "flameC");
      fx.setOrigin(0.5);

      // scale 적용
      fx.setScale(scale);

      // VFX 적용
      applyVFX(scene, fx, this.base.vfx); // flame_pulse

      // 애니메이션
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
    // 🔥 지속 도트 데미지 (FlameA/B와 동일: 총 2틱)
    // ======================================================
    const interval = duration / 2;
    for (let i = 1; i <= 2; i++) {
      scene.time.delayedCall(i * interval, () => {
        for (const f of flames) {
          scene.damageArea({
            x: f.x,
            y: f.y,
            radius,
            dmg: tickDmg,
            onHit: () => this.shakeCameraOnHit(scene),
          });
        }
      });
    }

    // ======================================================
    // 🔥 애니메이션 끝나면 안전 destroy (5개 모두)
    // ======================================================
    for (const f of flames) {
      f.fx.once("animationcomplete", () => {
        f.fx.setVisible(false);
        scene.time.delayedCall(0, () => {
          f.fx.destroy?.();
        });
      });
    }

    scene.textBar = `Flame C (Lv${this.level})`;
  }
}
