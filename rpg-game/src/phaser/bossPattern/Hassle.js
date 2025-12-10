import { BossPatternBase } from "./BossPatternBase";

export class Hassle extends BossPatternBase {
  cast(scene, caster) {
    scene.SoundManager.playHassle();
    scene.isHassle = true;
    scene.time.delayedCall(7500, () => {
        scene.SoundManager.playHassle();
        scene.isHassle = false;
    })
  }
}
