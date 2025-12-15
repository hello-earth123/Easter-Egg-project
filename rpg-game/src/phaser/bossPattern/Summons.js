import Phaser from "phaser";
import { spawnMonsters } from "../entities/TestMonsterFactory.js";
import { BossPatternBase } from "./BossPatternBase";

export class Summons extends BossPatternBase {
  cast(scene, caster) {
    const sx = scene.player.x;
    const sy = scene.player.y;
    // 예고 이펙트 추가

    scene.time.delayedCall(500, () => {
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