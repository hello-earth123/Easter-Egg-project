import Phaser from "phaser";
import { createDefaultSkills } from "../skills/index.js";
import { createDefaultPatterns } from "../bossPattern/index.js";
import { Heap } from 'heap-js';

/** 몬스터 레벨 별 수치 변동 */
export function makeMonsterStats(def, scene) {
  const level = Phaser.Math.Between(scene.minLevel, scene.maxLevel);
  const maxHp = Math.floor(def.baseHP * Math.pow(def.growthHP, level));
  const atk = Math.floor(def.baseAtk * Math.pow(def.growthAtk, level));
  const expRw = Math.floor(def.baseExp * Math.pow(def.growthExp, level));
  return { level, maxHp, atk, expReward: expRw };
}

let BossInstance;

/** 몬스터 객체 생성 및 scene에 추가 - TODO */
export function spawnBoss(scene, boss) {
  const names = boss;

  // 🔥 몬스터 이름별 크기 매핑 테이블
  const MONSTER_SCALE = {
      coffin: 3.0,
      vampire: 10.0,
  };

    // 몬스터 종류별 이동 애니메이션 key 매핑
  scene.monsterWalkAnim = {
      coffin: "coffin_walk",
      vampire: "vampire_walk",
  };

  const MONSTER_HITBOX = {
      coffin:     { w:0.55, h:0.95, ox:0.225, oy:0.05 },
      vampire:    { w:0.42, h:0.95, ox:0.29,  oy:0.04 }, // 보스 ㅋ
  };

  fetch("http://127.0.0.1:8000/api/monsters/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names: names })
  })
    .then(res => res.json())
    .then(data => {
      data.forEach((def) => {
        BossInstance = scene.boss.create(200, 608, def.name);

        const scale = MONSTER_SCALE[def.name] ?? 1.5;
        BossInstance.setScale(scale);

        const w = BossInstance.width;
        const h = BossInstance.height;
        const hb = MONSTER_HITBOX[def.name] ?? {w:0.55, h:0.85, ox:0.225, oy:0.08};
        const hitW = w * hb.w;
        const hitH = h * hb.h;
        BossInstance.body.setSize(hitW, hitH);
        BossInstance.body.setOffset(
            (w - hitW) * 0.5,
            (h - hitH) * 0.5,
        )

        const stats = makeMonsterStats(def, scene);

        Object.assign(BossInstance, {
            name: def.name,
            level: stats.level,
            maxHp: stats.maxHp,
            hp: stats.maxHp,
            atk: stats.atk,
            expReward: stats.expReward,
            dropTable: def.drop,

            isAggro: false,
            isFrozen: true,
            isKnockback: false,
            knockbackVel: new Phaser.Math.Vector2(0, 0),
            hpBar: scene.add.graphics(),
            label: scene.add.text(0, 0, `Lv${stats.level} ${def.name}`, {
              fontSize: "12px",
              fill: "#fff",
            }),

            // 🔥 추가: 배회(wander)용 상태값들
            wanderOriginX: BossInstance.x,
            wanderOriginY: BossInstance.y,
            // “한 칸에서 세 칸” 정도 – 타일 32px 기준으로 대략 32~96
            wanderRange: Phaser.Math.Between(32, 96),
            wanderSpeed: Phaser.Math.Between(25, 45),  // 배회 속도
            wanderTargetX: null,
            wanderTargetY: null,
            wanderPauseUntil: 0,

            isAttack: false,
            patternSet: createDefaultPatterns(),
            nextPattern: new Heap((a, b) => a - b),
            isInit: false,
        });

        BossInstance.setCollideWorldBounds(true);
      });
    })
}

function CastSkill(skill, scene){
    if (BossInstance.name == 'coffin'){
        switch(skill){
        // 기본 공격 (추적 번개)
        case 999:
            BossInstance.patternSet['thunder'].tryCast(scene, BossInstance);
            cooltime(scene, 999, 2.5);
            break;
        case 1:
            BossInstance.patternSet['summons'].tryCast(scene, BossInstance);
            cooltime(scene, 1, 50);
            break;
        case 2:
            BossInstance.patternSet['fireshoot'].tryCast(scene, BossInstance);
            cooltime(scene, 2, 30);
            break;
        case 3:
            BossInstance.patternSet['hassle'].tryCast(scene, BossInstance);
            cooltime(scene, 3, 40);
            break;
        }
    }
    else{
        return;
    }
}

function initPattern(scene){
    cooltime(scene, 999, 1);
    cooltime(scene, 1, 17);
    cooltime(scene, 2, 10);
    cooltime(scene, 3, 30);
}

export function ChooseNextSkill(scene){
    if (!BossInstance.isInit){
        BossInstance.isInit = true;
        initPattern(scene);
    }

    if (BossInstance.isAttack) return;
    if (!BossInstance.nextPattern) return;

    BossInstance.isAttack = true;

    scene.time.delayedCall(1400, () => {
        BossInstance.isAttack = false;
    })

    const pattern = BossInstance.nextPattern.pop();

    CastSkill(pattern, scene);
}

function cooltime(scene, target, cool){
    scene.time.delayedCall(cool * 1000, () => {
        BossInstance.nextPattern.push(target);
    })
}