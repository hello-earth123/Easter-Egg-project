import Phaser from "phaser";
import { CFG } from "../config/Config.js";

/** 몬스터 레벨 별 수치 변동 */
export function makeMonsterStats(def, scene) {
  const level = Phaser.Math.Between(scene.minLevel, scene.maxLevel);
  const maxHp = Math.floor(def.baseHP * Math.pow(def.growthHP, level));
  const atk = Math.floor(def.baseAtk * Math.pow(def.growthAtk, level));
  const expRw = Math.floor(def.baseExp * Math.pow(def.growthExp, level));
  return { level, maxHp, atk, expReward: expRw };
}

function relocateMonster(scene, monster) {
  const safePoints = scene.safeSpawnPoints; // 미리 정의
  const len = safePoints.length;
  const locate = Phaser.Math.Between(0, len - 1);

  monster.setPosition(safePoints[locate][0], safePoints[locate][1]);
  monster.body.updateFromGameObject();
}

export function spawnMonsters(scene) {
  const names = Object.keys(scene.monsterData)

  // 몬스터 이름별 크기 매핑 테이블
  const MONSTER_SCALE = {
    arrow_skeleton: 2.3,
    bat: 2.0,
    bird: 2.5,
    butterfly: 2.3,
    coffin: 3.0,
    colossus: 10.0,
    dwarf: 3.0,
    eyeball: 4.0,
    eyebat: 3.3,
    fire_skull1: 2.5,
    fire_skull2: 2.5,
    ghost: 2.5,
    hidden: 4.0,
    lich: 4.0,
    mask: 2.5,
    mimic: 2.7,
    moai_b: 3.5,
    moai_s: 3.5,
    moai_g: 3.5,
    mummy: 3.2,
    mushroom: 3.5,
    rabbit: 3.0,
    reaper: 4.3,
    scorpion: 3.3,
    skeleton: 3.0,
    skull_b: 2.6,
    skull_w: 2.6,
    slime: 2.8,
    snail: 2.7,
    snake: 2.5,
    squirrel: 2.2,
    stingsnake: 3.5,
    vampire: 10.0,
    weapon: 3.5,
    wolf: 3.4,
  };

  // 몬스터 종류별 이동 애니메이션 key 매핑
  scene.monsterWalkAnim = {
    arrow_skeleton: "arrow_skeleton_walk",
    bat: "bat_walk",
    bird: "bird_walk",
    butterfly: "butterfly_walk",
    coffin: "coffin_walk",
    colossus: "colossus_walk",
    dwarf: "dwarf_walk",
    eyeball: "eyeball_walk",
    eyebat: "eyebat_walk",
    fire_skull1: "fire_skull1_walk",
    fire_skull2: "fire_skull2_walk",
    ghost: "ghost_walk",
    lich: "lich_walk",
    mask: "mask_walk",
    mimic: "mimic_walk",
    moai_b: "moai-b_walk",
    moai_s: "moai-s_walk",
    moai_g: "moai-g_walk",
    mummy: "mummy_walk",
    mushroom: "mushroom_walk",
    rabbit: "rabbit_walk",
    reaper: "reaper_walk",
    scorpion: "scorpion_walk",
    skeleton: "skeleton_walk",
    skull_b: "skull_b_walk",
    skull_w: "skull_w_walk",
    slime: "slime_walk",
    snail: "snail_walk",
    snake: "snake_walk",
    squirrel: "squirrel_walk",
    stingsnake: "stingsnake_walk",
    vampire: "vampire_walk",
    weapon: "weapon_walk",
    wolf: "wolf_walk",
  };

  const MONSTER_HITBOX = {
    bat: { w: 0.40, h: 0.80, ox: 0.275, oy: 0.10 },
    bird: { w: 0.50, h: 0.85, ox: 0.25, oy: 0.08 },
    butterfly: { w: 0.40, h: 0.80, ox: 0.30, oy: 0.12 },
    coffin: { w: 0.55, h: 0.95, ox: 0.225, oy: 0.05 },
    colossus: { w: 0.45, h: 0.90, ox: 0.275, oy: 0.05 },
    dwarf: { w: 0.55, h: 0.90, ox: 0.225, oy: 0.06 },
    eyeball: { w: 0.50, h: 0.80, ox: 0.25, oy: 0.10 },
    eyebat: { w: 0.48, h: 0.80, ox: 0.26, oy: 0.10 },
    fire_skull1: { w: 0.50, h: 0.80, ox: 0.25, oy: 0.10 },
    fire_skull2: { w: 0.50, h: 0.80, ox: 0.25, oy: 0.10 },
    ghost: { w: 0.55, h: 0.85, ox: 0.225, oy: 0.08 },
    hidden: { w: 0.55, h: 0.85, ox: 0.225, oy: 0.08 },
    lich: { w: 0.50, h: 0.90, ox: 0.20, oy: 0.05 },
    mask: { w: 0.50, h: 0.85, ox: 0.25, oy: 0.08 },
    mimic: { w: 0.60, h: 0.75, ox: 0.20, oy: 0.12 },
    moai_b: { w: 0.55, h: 0.95, ox: 0.225, oy: 0.04 },
    moai_s: { w: 0.55, h: 0.95, ox: 0.225, oy: 0.04 },
    moai_g: { w: 0.55, h: 0.95, ox: 0.225, oy: 0.04 },
    mummy: { w: 0.55, h: 0.90, ox: 0.225, oy: 0.06 },
    mushroom: { w: 0.55, h: 0.80, ox: 0.225, oy: 0.10 },
    rabbit: { w: 0.40, h: 0.90, ox: 0.20, oy: 0.05 },
    reaper: { w: 0.55, h: 0.95, ox: 0.225, oy: 0.05 },
    scorpion: { w: 0.55, h: 0.75, ox: 0.225, oy: 0.12 },
    skeleton: { w: 0.58, h: 0.90, ox: 0.21, oy: 0.06 },
    skull_b: { w: 0.50, h: 0.80, ox: 0.25, oy: 0.10 },
    skull_w: { w: 0.50, h: 0.80, ox: 0.25, oy: 0.10 },
    slime: { w: 0.60, h: 0.70, ox: 0.20, oy: 0.15 },
    snail: { w: 0.58, h: 0.70, ox: 0.21, oy: 0.15 },
    snake: { w: 0.45, h: 0.85, ox: 0.275, oy: 0.08 },
    squirrel: { w: 0.55, h: 0.85, ox: 0.225, oy: 0.08 },
    stingsnake: { w: 0.45, h: 0.85, ox: 0.275, oy: 0.08 },
    vampire: { w: 0.42, h: 0.95, ox: 0.29, oy: 0.04 }, // 보스 ㅋ
    weapon: { w: 0.55, h: 0.85, ox: 0.225, oy: 0.08 },
    wolf: { w: 0.58, h: 0.85, ox: 0.21, oy: 0.08 },
  };

  const monsterName = {
    arrow_skeleton: "많이 썩은 시체",
    bat: "박쥐",
    bird: "시체 먹이 새",
    butterfly: "황혼 나비",
    colossus: "수호 거인",
    dwarf: "노움",
    eyeball: "눈알",
    eyebat: "외눈 박쥐",
    fire_skull1: "불타는 두개골",
    fire_skull2: "불타는 두개골",
    ghost: "원혼",
    hidden: "테스트",
    lich: "리치",
    mask: "저주받은 가면",
    mimic: "미믹",
    moai_b: "황동 조각상",
    moai_s: "은 조각상",
    moai_g: "금 조각상",
    mummy: "조금 썩은 시체",
    mushroom: "시체 버섯",
    rabbit: "토끼",
    reaper: "사신",
    scorpion: "변이한 전갈",
    skeleton: "스켈레톤",
    skull_b: "검은 두개골",
    skull_w: "하얀 두개골",
    slime: "무덤 슬라임",
    snail: "뇌팽이",
    snake: "독사",
    squirrel: "다람쥐",
    stingsnake: "변이한 독사",
    weapon: "귀신 들린 검",
    wolf: "산 늑대",
  }

  fetch("http://121.162.159.56:8000/api/monsters/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names: names })
  })
    .then(res => res.json())
    .then(data => {
      data.forEach((def) => {
        for (let i = 0; i < scene.monsterData[def.name]; i++) {
          let sx = Phaser.Math.Between(200, CFG.world.width - 200);
          let sy = Phaser.Math.Between(200, CFG.world.height - 200);
          let createTime = 0;

          if (!scene.boss && def.name == 'colossus') {
            sx = 800;
            sy = 608;
          }

          if (scene.boss) {
            // 예고 이펙트
            const radius = MONSTER_SCALE[def.name] * 1.3;
            const g = scene.add.circle(sx, sy, 6, 0x6ed953, 0.9);
            g.setScale(1);
            scene.tweens.add({
              targets: g,
              scale: radius,
              alpha: 0.0,
              duration: 600,
              onComplete: () => g.destroy(),
            });
            createTime = 700;

            def.maxHp *= 0.3;
          }

          scene.time.delayedCall(createTime, () => {
            // scene에 몬스터 추가
            const m = scene.monsters.create(
              sx,
              sy,
              def.name
            );

            // 몬스터 스케일 적용 (sprite만 스케일)
            const scale = MONSTER_SCALE[def.name] ?? 1.5;
            m.setScale(scale);

            // Sprite의 실제 렌더링 크기 (scale 이미 반영됨)
            const w = m.width;
            const h = m.height;

            // 몬스터별 히트박스 정보 가져오기
            const hb = MONSTER_HITBOX[def.name] ?? { w: 0.55, h: 0.85, ox: 0.225, oy: 0.08 };

            // 최종 히트박스 크기
            let hitW = w * hb.w;
            let hitH = h * hb.h;

            // Body 적용 (sprite에서 벗어나지 않게)
            m.body.setSize(hitW, hitH);

            // 중앙 정렬 offset 적용 (절대 out-of-range 되지 않음)
            m.body.setOffset(
              (w - hitW) * 0.5,  // 기존: w * hb.ox
              (h - hitH) * 0.5   // 기존: h * hb.oy
            );

            if (def.name.includes('moai')) {
              hitW *= 0.5;
              hitH *= 0.5;
              m.body.setSize(hitW, hitH);
              m.body.setOffset(
                w * hb.ox,
                h * hb.oy
              );
            }

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
              label: scene.add.text(0, 0, `Lv${stats.level} ${monsterName[def.name]}`, {
                fontSize: "12px",
                fill: "#fff",
              }),
              // 배회(wander)용 상태값들
              wanderOriginX: m.x,
              wanderOriginY: m.y,
              // “한 칸에서 세 칸” 정도 – 타일 32px 기준으로 대략 32~96
              wanderRange: Phaser.Math.Between(32, 96),
              wanderSpeed: Phaser.Math.Between(25, 45),  // 배회 속도
              wanderTargetX: null,
              wanderTargetY: null,
              wanderPauseUntil: 0,
            });

            // 움직일 수 있는 최대 범위 설정
            m.setCollideWorldBounds(true);

            if (scene.physics.overlap(m, scene.wallGroup)) {
              relocateMonster(scene, m);
            }
          })
        }
      });
    })
}
