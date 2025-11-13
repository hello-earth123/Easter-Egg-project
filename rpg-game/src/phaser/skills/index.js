import { CFG } from "../config/Config.js";
import { ProjectileSkill } from "./ProjectileSkill.js";
import { ShockwaveSkill } from "./ShockwaveSkill.js";
import { ConeSkill } from "./ConeSkill.js";
import { ProjShockwaveSkill } from "./ProjShockwaveSkill.js";
import { LightningSkill } from "./LightningSkill.js";
import { DotSkill } from "./DotSkill.js";
import { FreezeSkill } from "./FreezeSkill.js";
import { KnockbackSkill } from "./KnockbackSkill.js";

export function createDefaultSkills() {
  return {
    // 각 스킬 인스턴스 생성 - ('스킬 타입명', 스킬의 기본 스펙)은 각 스킬 클래스가 상속 중인 SkillBase의 Constructor로 전달
    "Skill 1": new ProjectileSkill("projectile", CFG.skillBase.projectile),
    "Skill 2": new ShockwaveSkill("shockwave", CFG.skillBase.shockwave),
    "Skill 3": new ConeSkill("cone", CFG.skillBase.cone),
    "Skill 4": new ProjShockwaveSkill("projWave", CFG.skillBase.projWave),
    "Skill 5": new LightningSkill("lightning", CFG.skillBase.lightning),
    "Skill 6": new DotSkill("dot", CFG.skillBase.dot),
    "Skill 7": new FreezeSkill("freeze", CFG.skillBase.freeze),
    "Skill 8": new KnockbackSkill("knockback", CFG.skillBase.knockback),
  };
}
