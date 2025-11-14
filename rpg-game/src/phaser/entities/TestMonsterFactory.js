import Phaser from "phaser";
import { CFG } from "../config/Config.js";

/** 몬스터 레벨 별 수치 변동 */
export function makeMonsterStats(def) {
  const level = Phaser.Math.Between(def.minLevel, def.maxLevel);
  const maxHp = Math.floor(def.baseHp * Math.pow(level, def.hpExp));
  const atk = Math.floor(def.baseAtk * Math.pow(level, def.atkExp));
  const expRw = Math.floor(def.expBase * Math.pow(level, def.expExp));
  return { level, maxHp, atk, expReward: expRw };
}

/** 몬스터 객체 생성 및 scene에 추가 - TODO */
export function spawnMonsters(scene) {
  CFG.monsters.forEach((def) => {
    for (let now = 0; now < scene.monsterData.length; now++) {
      if (def.key == scene.monsterData[now][0]) {
        for (let i = 0; i < scene.monsterData[now][1]; i++) {
          // scene에 몬스터 추가
          const m = scene.monsters.create(
            Phaser.Math.Between(200, CFG.world.width - 200),
            Phaser.Math.Between(200, CFG.world.height - 200),
            "monster"
          );

          // TODO: sprite 연결
          const stats = makeMonsterStats(def);
          Object.assign(m, {
            name: def.name,
            level: stats.level,
            maxHp: stats.maxHp,
            hp: stats.maxHp,
            atk: stats.atk,
            expReward: stats.expReward,
            dropTable: def.dropTable,
            isAggro: false,
            isFrozen: false,
            isKnockback: false,
            knockbackVel: new Phaser.Math.Vector2(0, 0),
            hpBar: scene.add.graphics(),
            label: scene.add.text(0, 0, `Lv${stats.level} ${def.name}`, {
              fontSize: "12px",
              fill: "#fff",
            }),
          });

          // 움직일 수 있는 최대 범위 설정
          m.setCollideWorldBounds(true);
          // collider box type > circle
          m.body.setCircle(Math.max(m.width, m.height) / 2);
        }
      }
    }
  });
}
