// skills/FireBomb.js
import { FireSkillBase } from "./FireSkillBase.js";
import { applyVFX } from "../utils/SkillVFX.js";

export class FireBomb extends FireSkillBase {

  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  }

  cast(scene, caster) {

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

        let dmg = this.getDamage();

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

        if (scene.boss){
          scene.boss.children.iterate(b => {
            if (!b || !b.active) return;

            const dx = b.x - x;
            const dy = b.y - y;
            if (dx * dx + dy * dy > radius * radius) return;

            didHitMonster = true;

            const servuntC = scene.monsters.getLength();
            dmg -= Math.round(dmg * servuntC / 10);

            scene.showDamageText(b, dmg, "#ffff66");
            b.hp -= dmg;
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
