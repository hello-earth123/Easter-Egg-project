// skills/FireBomb.js
import { FireSkillBase } from "./FireSkillBase.js";

export class FireBomb extends FireSkillBase {
  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  }

  cast(scene, caster) {
    const dir = this.getDir(caster);

    const dist = this.base.distance ?? 140;
    const x = caster.x + dir.x * dist;
    const y = caster.y + dir.y * dist;

    const fx = scene.add.sprite(x, y, "firebomb");
    fx.play("firebomb");

    const radius = this.base.radius ?? 100;
    const dmg = this.getDamage();

    let damageApplied = false;       // 데미지를 한 번만 적용
    let didHitMonster = false;       // 실제로 몬스터가 맞았는지 여부

    fx.on("animationupdate", (_, frame) => {
      // 정확히 9프레임에서만 데미지 계산
      if (!damageApplied && frame.index === 9) {
        damageApplied = true;

        // 🔥 데미지 적용 + 몬스터 맞았는지 체크
        scene.monsters.children.iterate(mon => {
          if (!mon || !mon.active) return;

          const dx = mon.x - x;
          const dy = mon.y - y;
          if (dx * dx + dy * dy > radius * radius) return;

          // 몬스터가 실제로 맞았음
          didHitMonster = true;

          // 데미지 적용
          mon.hp -= dmg;
          scene.spawnHitFlash(mon.x, mon.y);
          scene.onMonsterAggro(mon);
        });

        // 🔥 명중한 경우에만 카메라 흔들기
        if (didHitMonster) {
          this.shakeCameraOnHit(scene);
        }
      }
    });

    fx.on("animationcomplete", () => fx.destroy());

    scene.textBar = `Fire Bomb (Lv${this.level})`;
  }
}
