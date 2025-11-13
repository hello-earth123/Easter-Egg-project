import Phaser from "phaser";
import { Skill } from "./SkillBase.js";

export class ProjShockwaveSkill extends Skill {
  getDamage() {
    return this.scaledDamage(this.base.baseDmg);
  } // shockwave dmg
  getManaCost() {
    return this.scaledCost(this.base.baseCost);
  }
  getProjDamage() {
    return this.scaledDamage(this.base.projDmg || 10);
  }

  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();

    const b = scene.bullets.create(
      caster.x + dir.x * 20,
      caster.y + dir.y * 20,
      "bullet"
    );
    b.setVelocity(dir.x * 380, dir.y * 380);
    b.damage = this.getProjDamage();

    // 🔒 안전한 onHit 처리 (죽은 몬스터/비활성 참조 방지)
    b.onHit = (monster) => {
      if (!monster || !monster.active) return;
      scene.spawnShockwave(
        monster.x,
        monster.y,
        this.base.radius,
        this.getDamage()
      );
    };

    scene.textBar = `투사체+충격파 (Lv${this.level})`;
  }
}
