// index.js
import { Fireball } from "./Fireball.js";
import { FlameA } from "./FlameA.js";
import { FlameB } from "./FlameB.js";
import { FlameC } from "./FlameC.js";
import { FireBomb } from "./FireBomb.js";
import { Incendiary } from "./Incendiary.js";
import { MeteorS } from "./MeteorS.js";
import { MeteorM } from "./MeteorM.js";
import { MeteorL } from "./MeteorL.js";
import { Napalm } from "./Napalm.js";
import { DeathHand } from "./DeathHand.js";
import { BuffSkill } from "./BuffSkill.js";
import { CFG } from "../config/Config.js";

export function createDefaultSkills() {
    return {

        fireball:   new Fireball("fireball", CFG.fireball),
        buff:       new BuffSkill("buff", CFG.buff),

        flameA:     new FlameA("flameA", CFG.flameA),
        flameB:     new FlameB("flameB", CFG.flameB),
        flameC:     new FlameC("flameC", CFG.flameC),

        firebomb:   new FireBomb("firebomb", CFG.firebomb),
        incendiary: new Incendiary("incendiary", CFG.incendiary),

        meteor_S:   new MeteorS("meteor_S", CFG.meteor_S),
        meteor_M:   new MeteorM("meteor_M", CFG.meteor_M),
        meteor_L:   new MeteorL("meteor_L", CFG.meteor_L),

        napalm:     new Napalm("napalm", CFG.napalm),
        deathhand:  new DeathHand("deathhand", CFG.deathhand),
    };
}
