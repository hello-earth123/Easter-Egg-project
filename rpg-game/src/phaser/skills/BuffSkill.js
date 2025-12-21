// skills/BuffSkill.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class BuffSkill extends FireSkillBase {
  cast(scene, caster) {

    // === 버프 스프라이트 생성 ===
    const fx = scene.add.sprite(caster.x, caster.y - 30, "buff");
    fx.setOrigin(0.5);

    // === scale 적용 (Config 기반) ===
    const scale = this.base.scale ?? 1.2;
    fx.setScale(scale);

    // === VFX 적용 (buff_aura) ===
    applyVFX(scene, fx, this.base.vfx);

    // === 애니메이션 재생 ===
    fx.play("buff");

    // === 플레이어 따라가기 ===
    fx.update = () => {
      fx.x = caster.x;
      fx.y = caster.y - 30;
    };
    scene.events.on("update", fx.update, fx);

    // === FX 애니메이션(비주얼) 완료 → FX만 제거 ===
    fx.once("animationcomplete", () => {
      scene.events.off("update", fx.update, fx);

      fx.setVisible(false);
      scene.time.delayedCall(0, () => {
        if (fx && fx.destroy) fx.destroy();
      });
    });

    // ==================================
    // 버프 능력치 적용 (1분 지속)
    // ==================================
    const damageMultiplier = 1.0 + (0.20 + (this.level) * 0.05);
    const manaCostMultiplier = 1.0 + (0.30 + (this.level) * 0.01);

    const stats = scene.playerStats;

    this.buffTimer = null;
    this.buffDamageMultiplier = 1.0;
    this.buffManaCostMultiplier = 1.0;

    // ===============================
    // 중복 버프 처리 (갱신)
    // ===============================
    if (stats.buffTimer) {
      stats.buffTimer.destroy();

      stats.clearBuff({
        damageMultiplier: stats.buffDamageMultiplier,
        manaCostMultiplier: stats.buffManaCostMultiplier,
      });

      stats.buffTimer = null;
    }

    // 버프 적용
    stats.applyBuff({
      damageMultiplier,
      manaCostMultiplier,
    });

    // 현재 버프 정보 저장
    stats.buffDamageMultiplier = damageMultiplier;
    stats.buffManaCostMultiplier = manaCostMultiplier;

        // ✅ 씬이 꺼질 때 버프가 영구로 남지 않게 강제 정리
    const cleanupBuffOnSceneExit = () => {
      // 타이머 정리
      if (stats.buffTimer) {
        stats.buffTimer.remove?.(false);
        stats.buffTimer.destroy?.();
        stats.buffTimer = null;
      }

      // 버프 해제 (현재 저장된 배수 기준)
      if (stats.buffDamageMultiplier !== 1.0 || stats.buffManaCostMultiplier !== 1.0) {
        stats.clearBuff({
          damageMultiplier: stats.buffDamageMultiplier,
          manaCostMultiplier: stats.buffManaCostMultiplier,
        });
      }

      // 값 리셋 (다음 씬에서 “이미 버프중” 같은 판정 방지)
      stats.buffDamageMultiplier = 1.0;
      stats.buffManaCostMultiplier = 1.0;
    };

    // once로 중복 등록 방지
    scene.events.once("shutdown", cleanupBuffOnSceneExit);
    scene.events.once("destroy", cleanupBuffOnSceneExit);

    // === ⏳ 1분(60000ms) 뒤 능력치 복구 ===
    stats.buffTimer = scene.time.delayedCall(60000, () => {
      stats.clearBuff({
        damageMultiplier,
        manaCostMultiplier,
      });

      stats.buffTimer = null;
    });

    // UI 출력
    scene.textBar = `Buff (Lv${this.level})`;
  }
}
