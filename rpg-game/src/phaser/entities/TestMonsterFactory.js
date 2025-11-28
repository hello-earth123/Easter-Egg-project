import Phaser from "phaser";
import { CFG } from "../config/Config.js";

/** 몬스터 레벨 별 수치 변동 */
export function makeMonsterStats(def, scene) {
  const level = Phaser.Math.Between(scene.minLevel, scene.maxLevel);
  const maxHp = Math.floor(def.baseHP * Math.pow(level, def.growthHP));
  const atk = Math.floor(def.baseAtk * Math.pow(level, def.growthAtk));
  const expRw = Math.floor(def.baseExp * Math.pow(level, def.growthExp));
  return { level, maxHp, atk, expReward: expRw };
}

/** 몬스터 객체 생성 및 scene에 추가 - TODO */
/** 251119 - 몬스터 아니고 아이템으로 생성되는 중이며 아이템 습득 시, 인벤토리로 들어가지 않음 */
export function spawnMonsters(scene) {
  const names = Object.keys(scene.monsterData)

  fetch("http://127.0.0.1:8000/api/monsters/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names: names })
  })
    .then(res => res.json())
    .then(data => {
      data.forEach((def) => {
        for (let i = 0; i < scene.monsterData[def.name]; i++) {
          // scene에 몬스터 추가
          const m = scene.monsters.create(
            Phaser.Math.Between(200, CFG.world.width - 200),
            Phaser.Math.Between(200, CFG.world.height - 200),
            def.name
          );
          m.setDisplaySize(64, 64);

          const stats = makeMonsterStats(def, scene);
          Object.assign(m, {
            name: def.name,
            level: stats.level,
            maxHp: stats.maxHp,
            hp: stats.maxHp,
            atk: stats.atk,
            expReward: stats.expReward,
            dropTable: def.drop,
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
      });
    })
}
