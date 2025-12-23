// skills/FireBomb.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";
import { CFG } from "../config/Config.js";

export class FireBomb extends FireSkillBase {

  getDamage(level) {
    return this.scaledDamage(this.base.baseDmg, level);
  }

  cast(scene, caster, level) {

    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 200;
    const x = caster.x + dir.x * dist;
    const y = caster.y + dir.y * dist;

    // === 🔥 FireBomb 스프라이트 생성 ===
    const fx = scene.add.sprite(x, y, "firebomb");
    fx.setOrigin(0.5);

    // === 🔥 scale + VFX 적용 ===
    const scale = this.base.scale ?? 1.4;
    fx.setScale(scale);
    applyVFX(scene, fx, this.base.vfx);

    // === 🔥 폭발 애니메이션 재생 ===
    fx.play("firebomb");

    const radius = this.base.radius ?? 100;

    let damageApplied = false;
    let didHitMonster = false;

    // === 🔥 기존 FireBomb 핵심 기능: 9프레임 정확 판정 ===
    fx.on("animationupdate", (_, frame) => {
      if (!damageApplied && frame.index === 9) {
        damageApplied = true;

        let dmg = this.getDamage(level);

        scene.monsters.children.iterate(mon => {
          if (!mon || !mon.active) return;

          const dx = mon.x - x;
          const dy = mon.y - y;
          if (dx * dx + dy * dy > radius * radius) return;

          didHitMonster = true;

          scene.showDamageText(mon, dmg, "#ffff66");
          mon.hp -= dmg;
          scene.spawnHitFlash(mon.x, mon.y);
          scene.onMonsterAggro(mon);
        });

        if (scene.boss) {
          scene.boss.children.iterate(b => {
            if (!b || !b.active) return;

            const dx = b.x - x;
            const dy = b.y - y;
            if (dx * dx + dy * dy > radius * radius) return;

            didHitMonster = true;

            const servuntC = scene.monsters.getLength();
            dmg -= Math.round(dmg * servuntC / 10);

            if (b.doReflect) {
              dmg = Math.round(dmg - (dmg / 2));

              // 반사딜로 죽지 않음
              if (scene.playerStats.hp > dmg) {
                scene.playerStats.hp -= dmg;
                // 플레이어 피격 sound
                scene.SoundManager.playMonsterAttack();
                // 피격 데미지 출력 (빨간색)
                scene.showDamageText(scene.player, dmg, "#ff3333");
                // 피격 효과 (카메라, 색상)
                scene.cameras.main.shake(
                  CFG.playerKB.shake.duration,
                  CFG.playerKB.shake.intensity
                );
                scene.player.setTint(0xff6666);
                scene.time.delayedCall(CFG.playerKB.invulMs, () => {
                  if (scene.player) scene.player.clearTint();
                });
              }
            }
            b.hp -= dmg;
            scene.showDamageText(b, dmg, "#ffff66");
            scene.spawnHitFlash(b.x, b.y);
            scene.onMonsterAggro(b);
          });
        }

        if (didHitMonster) {
          this.shakeCameraOnHit(scene);
        }
      }
    });

    // === 🔥 애니메이션 완료 = 안전 Destroy ===
    fx.once("animationcomplete", () => {
      fx.setVisible(false);
      scene.time.delayedCall(0, () => fx.destroy?.());
    });

    scene.textBar = `Fire Bomb (Lv${this.level})`;
  }
}
