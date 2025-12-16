import Phaser from "phaser";
import { spawnMonsters } from "../entities/TestMonsterFactory.js";
import { BossPatternBase } from "./BossPatternBase";

export class Summons extends BossPatternBase {
  cast(scene, caster) {
    scene.time.delayedCall(500, () => {
      if(caster.name == 'vampire') caster.isFrozen = false;

      const monsters = [...scene.monsters.getChildren()];
      monsters.forEach((m) => {
        if (!m) return
        
        if (m.hpBar) m.hpBar.clear();
        if (m.label) m.label.destroy();
        m.destroy();
      })
      spawnMonsters(scene);
      caster.isAttack = false;
    })
  }
}