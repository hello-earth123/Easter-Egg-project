// skills/FireSkillBase.js
import { Skill } from "./SkillBase.js";

export class FireSkillBase extends Skill {
  constructor(key, base) {
    super(key, base);
  }

  getDir(caster) {
    return caster.facing.clone().normalize();
  }

  shakeCameraOnHit(scene) {
    scene.cameras.main.shake(80, 0.005);
  }
}