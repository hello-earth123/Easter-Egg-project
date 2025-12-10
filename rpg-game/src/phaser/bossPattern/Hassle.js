import { BossPatternBase } from "./BossPatternBase";

export class Hassle extends BossPatternBase {
  cast(scene, caster) {
    scene.isHassle = true;
    scene.time.delayedCall(10000, () => {
        scene.isHassle = false;
    })
  }
}
