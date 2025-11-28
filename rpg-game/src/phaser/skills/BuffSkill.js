// skills/BuffSkill.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class BuffSkill extends FireSkillBase {
  cast(scene, caster) {

    // === 🔥 버프 스프라이트 생성 ===
    const fx = scene.add.sprite(caster.x, caster.y - 30, "buff");
    fx.setOrigin(0.5);

    // === 🔥 scale 적용 (Config 기반) ===
    const scale = this.base.scale ?? 1.2;
    fx.setScale(scale);

    // === 🔥 VFX 적용 (buff_aura) ===
    applyVFX(scene, fx, this.base.vfx);

    // === 🔥 애니메이션 재생 ===
    fx.play("buff");

    // === 🔥 플레이어 따라가기 ===
    fx.update = () => {
      fx.x = caster.x;
      fx.y = caster.y - 30;
    };
    scene.events.on("update", fx.update, fx);

    // === 🎬 FX 애니메이션(비주얼) 완료 → FX만 제거 ===
    fx.once("animationcomplete", () => {
      scene.events.off("update", fx.update, fx);

      fx.setVisible(false);
      scene.time.delayedCall(0, () => {
        if (fx && fx.destroy) fx.destroy();
      });
    });

    // ==================================
    // 🔥 버프 능력치 적용 (1분 지속)
    // ==================================
    const hpUp = this.base.hpUp || 0;
    const mpUp = this.base.mpUp || 0;

    // 원래 max 값 저장 (복구하려면 필요)
    const originalMaxHp = scene.playerStats.maxHp;
    const originalMaxMp = scene.playerStats.maxMp;

    // 버프 적용
    scene.playerStats.maxHp += hpUp;
    scene.playerStats.maxMp += mpUp;

    // 현재 HP/MP가 최대치를 넘지 않도록 보정
    scene.playerStats.hp = Math.min(scene.playerStats.hp, scene.playerStats.maxHp);
    scene.playerStats.mp = Math.min(scene.playerStats.mp, scene.playerStats.maxMp);

    // === ⏳ 1분(60000ms) 뒤 능력치 복구 ===
    scene.time.delayedCall(60000, () => {
      scene.playerStats.maxHp = originalMaxHp;
      scene.playerStats.maxMp = originalMaxMp;

      // HP/MP도 다시 보정
      scene.playerStats.hp = Math.min(scene.playerStats.hp, scene.playerStats.maxHp);
      scene.playerStats.mp = Math.min(scene.playerStats.mp, scene.playerStats.maxMp);
    });

    // UI 출력
    scene.textBar = `Buff (Lv${this.level})`;
  }
}
