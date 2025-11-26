// skills/BuffSkill.js
import { FireSkillBase } from "./FireSkillBase.js";

export class BuffSkill extends FireSkillBase {
  cast(scene, caster) {

    const fx = scene.add.sprite(caster.x, caster.y - 30, "buff").play("buff");

    // fx가 플레이어를 따라오도록 update 등록
    fx.update = () => {
      fx.x = caster.x;
      fx.y = caster.y - 30;
    };

    scene.events.on("update", fx.update, fx);

    fx.on("animationcomplete", () => {
      scene.events.off("update", fx.update, fx);
      fx.destroy();
    });


    // === 버프 적용 ===
    const hpUp = this.base.hpUp || 0;
    const mpUp = this.base.mpUp || 0;

    scene.playerStats.maxHp += hpUp;
    scene.playerStats.maxMp += mpUp;
    scene.playerStats.hp = Math.min(scene.playerStats.hp, scene.playerStats.maxHp);
    scene.playerStats.mp = Math.min(scene.playerStats.mp, scene.playerStats.maxMp);

    scene.textBar = `Buff (Lv${this.level})`;
  }
}
