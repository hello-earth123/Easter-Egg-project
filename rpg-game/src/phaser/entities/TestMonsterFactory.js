import Phaser from "phaser";
import { CFG } from "../config/Config.js";

/** 몬스터 레벨 별 수치 변동 */
export function makeMonsterStats(def, scene) {
  const level = Phaser.Math.Between(scene.minLevel, scene.maxLevel);
  const maxHp = Math.floor(def.baseHP * Math.pow(level, def.growthHP));
  const atk = Math.floor(def.baseAtk * Math.pow(def.growthAtk, level));
  const expRw = Math.floor(def.baseExp * Math.pow(level, def.growthExp));
  return { level, maxHp, atk, expReward: expRw };
}

/** 몬스터 객체 생성 및 scene에 추가 - TODO */
export function spawnMonsters(scene) {
  const names = Object.keys(scene.monsterData)

  // 🔥 몬스터 이름별 크기 매핑 테이블
  const MONSTER_SCALE = {
      bat: 2.0,
      bird: 2.5,
      butterfly: 2.3,
      coffin: 3.0,
      colossus: 6.0,
      dwarf: 3.0,
      eyeball: 4.0,
      eyebat: 3.3,
      fire_skull1: 2.5,
      fire_skull2: 2.5,
      ghost: 2.5,
      hidden: 1.4,
      lich: 4.0,
      mask: 2.5,
      mimic: 2.7,
      moai: 3.5,
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
      snake: 3.3,
      squirrel: 2.2,
      vampire: 10.0,
      weapon: 3.5,
      wolf: 2.5,
      // 필요한 만큼 계속 추가 가능
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
      mimic: "mimic",
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
      hidden: "hidden_walk",
  };

  const MONSTER_HITBOX = {
      bat:        { w:0.40, h:0.80, ox:0.275, oy:0.10 },
      bird:       { w:0.50, h:0.85, ox:0.25,  oy:0.08 },
      butterfly:  { w:0.40, h:0.80, ox:0.30,  oy:0.12 },
      coffin:     { w:0.55, h:0.95, ox:0.225, oy:0.05 },
      colossus:   { w:0.45, h:0.90, ox:0.275, oy:0.05 },
      dwarf:      { w:0.55, h:0.90, ox:0.225, oy:0.06 },
      eyeball:    { w:0.50, h:0.80, ox:0.25,  oy:0.10 },
      eyebat:     { w:0.48, h:0.80, ox:0.26,  oy:0.10 },
      fire_skull1:{ w:0.50, h:0.80, ox:0.25,  oy:0.10 },
      fire_skull2:{ w:0.50, h:0.80, ox:0.25,  oy:0.10 },
      ghost:      { w:0.55, h:0.85, ox:0.225, oy:0.08 },
      hidden:     { w:0.55, h:0.85, ox:0.225, oy:0.08 },
      lich:       { w:0.50, h:0.90, ox:0.20,  oy:0.05 },
      mask:       { w:0.50, h:0.85, ox:0.25,  oy:0.08 },
      mimic:      { w:0.60, h:0.75, ox:0.20,  oy:0.12 },
      moai:       { w:0.55, h:0.95, ox:0.225, oy:0.04 },
      mummy:      { w:0.55, h:0.90, ox:0.225, oy:0.06 },
      mushroom:   { w:0.55, h:0.80, ox:0.225, oy:0.10 },
      rabbit:     { w:0.40, h:0.90, ox:0.20,  oy:0.05 },
      reaper:     { w:0.55, h:0.95, ox:0.225, oy:0.05 },
      scorpion:   { w:0.55, h:0.75, ox:0.225, oy:0.12 },
      skeleton:   { w:0.58, h:0.90, ox:0.21,  oy:0.06 },
      skull_b:    { w:0.50, h:0.80, ox:0.25,  oy:0.10 },
      skull_w:    { w:0.50, h:0.80, ox:0.25,  oy:0.10 },
      slime:      { w:0.60, h:0.70, ox:0.20,  oy:0.15 },
      snail:      { w:0.58, h:0.70, ox:0.21,  oy:0.15 },
      snake:      { w:0.45, h:0.85, ox:0.275, oy:0.08 },
      squirrel:   { w:0.55, h:0.85, ox:0.225, oy:0.08 },
      stingsnake: { w:0.45, h:0.85, ox:0.275, oy:0.08 },
      vampire:    { w:0.42, h:0.95, ox:0.29,  oy:0.04 }, // 보스 ㅋ
      weapon:     { w:0.55, h:0.85, ox:0.225, oy:0.08 },
      wolf:       { w:0.58, h:0.85, ox:0.21,  oy:0.08 },
  };

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

          // 몬스터 스케일 적용 (sprite만 스케일)
          const scale = MONSTER_SCALE[def.name] ?? 1.5;
          m.setScale(scale);

          // Sprite의 실제 렌더링 크기 (scale 이미 반영됨)
          const w = m.width;
          const h = m.height;

          // 몬스터별 히트박스 정보 가져오기
          const hb = MONSTER_HITBOX[def.name] ?? { w:0.55, h:0.85, ox:0.225, oy:0.08 };

          // 최종 히트박스 크기
          const hitW = w * hb.w;
          const hitH = h * hb.h;

          // Body 적용 (sprite에서 벗어나지 않게)
          m.body.setSize(hitW, hitH);

          // 중앙 정렬 offset 적용 (절대 out-of-range 되지 않음)
          m.body.setOffset(
              (w - hitW) * 0.5,  // 기존: w * hb.ox
              (h - hitH) * 0.5   // 기존: h * hb.oy
          );

          // m.setDisplaySize(64, 64);

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
            // 🔥 추가: 배회(wander)용 상태값들
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
          // collider box type > circle
          // m.body.setCircle(Math.max(m.width, m.height) / 2);
        }
      });
    })
}
