import Phaser from "phaser";
import { CFG } from "../config/Config.js";

export function makeMonsterStats(def) {
  const level = Phaser.Math.Between(def.minLevel, def.maxLevel);
  const maxHp = Math.floor(def.baseHp * Math.pow(level, def.hpExp));
  const atk   = Math.floor(def.baseAtk * Math.pow(level, def.atkExp));
  const expRw = Math.floor(def.expBase * Math.pow(level, def.expExp));
  return { level, maxHp, atk, expReward: expRw };
}

export function spawnMonsters(scene) {
  CFG.monsters.forEach((def) => {
    for (let i = 0; i < def.count; i++) {
      const m = scene.monsters.create(
        Phaser.Math.Between(200, CFG.world.width - 200),
        Phaser.Math.Between(200, CFG.world.height - 200),
        "monster"
      );
      const stats = makeMonsterStats(def);
      Object.assign(m, {
        name: def.name,
        level: stats.level,
        maxHp: stats.maxHp,
        hp: stats.maxHp,
        atk: stats.atk,
        expReward: stats.expReward,
        dropTable: def.dropTable,
        isAggro: false, isFrozen: false, isKnockback: false,
        knockbackVel: new Phaser.Math.Vector2(0, 0),
        hpBar: scene.add.graphics(),
        label: scene.add.text(0, 0, `Lv${stats.level} ${def.name}`, { fontSize: "12px", fill: "#fff" }),
      });
      m.setCollideWorldBounds(true);
      m.body.setCircle(Math.max(m.width, m.height) / 2);
    }
  });
}
