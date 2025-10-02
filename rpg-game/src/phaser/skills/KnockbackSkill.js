import Phaser from "phaser";
import { Skill } from "./SkillBase.js";
import { CFG } from "../config/Config.js";

export class KnockbackSkill extends Skill {
  getDamage() { return this.base.hitDmg; }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();
    b.onHit = (monster) => {
      monster.isKnockback = true;
      monster.knockbackVel = dir.clone().scale(CFG.monsterKB.power);
    };
    scene.textBar = `넉백 투사체 (Lv${this.level})`;
  }
}
