// skills/BuffSkill.js
import { FireSkillBase } from "./FireSkillBase.js";

export class BuffSkill extends FireSkillBase {
  cast(scene, caster) {
    const fx = scene.add.sprite(caster.x, caster.y - 30, "buff").play("buff");
    fx.on("animationcomplete", () => fx.destroy());

    console.log(playerStats.hp, playerStats.maxHp)

    scene.playerStats.hp = Math.min(scene.playerStats.maxHp, scene.playerStats.hp + this.base.hpUp);
    scene.playerStats.mp = Math.min(scene.playerStats.maxMp, scene.playerStats.mp + this.base.mpUp);

    scene.textBar = `Buff (Lv${this.level})`;
  }
}
