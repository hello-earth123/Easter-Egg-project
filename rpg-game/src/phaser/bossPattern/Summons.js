import { spawnMonsters } from "../entities/TestMonsterFactory.js";
import { BossPatternBase } from "./BossPatternBase";

export class Summons extends BossPatternBase {
  cast(scene, caster) {
    const sx = scene.player.x;
    const sy = scene.player.y;
    // 예고 이펙트 추가

    scene.time.delayedCall(500, () => {
        spawnMonsters(scene);
    })
  }
}