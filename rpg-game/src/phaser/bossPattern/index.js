import { CFG } from "../config/Config.js";
import { Thunder } from "./thunder.js";
import { Summons } from "./summons.js";
import { FireShoot } from "./FireShoot.js";

export function createDefaultPatterns() {
    return {
        thunder: new Thunder('thunder', CFG.thunder),
        summons: new Summons('summons'),
        fireshoot: new FireShoot('fireshoot', CFG.fireshoot),
    };
}
