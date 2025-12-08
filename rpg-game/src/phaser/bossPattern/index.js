import { CFG } from "../config/Config.js";
import { Thunder } from "./thunder.js";
import { Summons } from "./summons.js";

export function createDefaultPatterns() {
    return {
        thunder: new Thunder('thunder', CFG.thunder),
        summons: new Summons('summons'),
    };
}
