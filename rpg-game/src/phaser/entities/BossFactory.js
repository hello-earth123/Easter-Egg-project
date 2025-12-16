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
      coffin: 5.0,
      vampire: 5.0,
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
        BossInstance = scene.boss.create(806, 590, def.name);

        const scale = MONSTER_SCALE[def.name] ?? 1.5;
        BossInstance.setScale(scale);

        // =============================================
        // 1페이즈 보스는 움직이지 않지만 애니메이션은 계속 재생
        const walkKey = scene.monsterWalkAnim[def.name];
        if (walkKey && scene.anims.exists(walkKey)) {
            BossInstance.play(walkKey, true);
        }
        // =============================================

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

            isAggro: true,
            isFrozen: def.name === 'coffin',
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

            doAvatar: false,
            doReflect: false,
        });

        BossInstance.setCollideWorldBounds(true);
      });
    })
}

function CastSkill(skill, scene){
    // 1 phase
    if (BossInstance.name == 'coffin'){
        switch(skill){
            // 기본 공격 (추적 번개)
            case 999:
                BossInstance.patternSet['thunder'].tryCast(scene, BossInstance);
                cooltime(scene, 999, 2.5);
                break;
            // 잡몹 소환 (마리당 10% 데미지 감소)
            case 1:
                BossInstance.patternSet['summons'].tryCast(scene, BossInstance);
                cooltime(scene, 1, 10);
                break;
            // 탄막 슈팅
            case 2:
                BossInstance.patternSet['fireshoot'].tryCast(scene, BossInstance);
                cooltime(scene, 2, 30);
                break;
            // 혼란
            case 3:
                BossInstance.patternSet['hassle'].tryCast(scene, BossInstance);
                cooltime(scene, 3, 40);
                break;
        }
    }
    // 2 phase
    else if (BossInstance.name == 'vampire'){
        BossInstance.isFrozen = true;
        switch(skill){
            // 기본 공격 (박쥐 무리)
            case 999:
                BossInstance.patternSet['batswarm'].tryCast(scene, BossInstance);
                cooltime(scene, 999, 2.5);
                break;
            // 특수 기믹
            case 0:
                BossInstance.patternSet['avatar'].tryCast(scene, BossInstance);
                break;
            // 잡몹 소환 (마리당 10% 데미지 감소)
            case 1:
                BossInstance.patternSet['summons'].tryCast(scene, BossInstance);
                cooltime(scene, 1, 65);
                break;
            case 2:
                BossInstance.patternSet['windAoe'].tryCast(scene, BossInstance);
                cooltime(scene, 2, 30);
                break;
            case 3:
                BossInstance.patternSet['reflectvoid'].tryCast(scene, BossInstance);
                cooltime(scene, 3, 30);
                break;
        }
    }
}

function initPattern(scene){
    if (BossInstance.name == 'coffin'){
        cooltime(scene, 999, 1);    // 기본 공격
        cooltime(scene, 1, 5);     // 잡몹 소환
        cooltime(scene, 2, 10);     // 탄막 슈팅
        cooltime(scene, 3, 30);     // 혼란
    }
    else if (BossInstance.name == 'vampire'){
        cooltime(scene, 999, 1);    // 기본 공격
        cooltime(scene, 1, 23);     // 잡몹 소환
        cooltime(scene, 2, 15);     // 바람 장판
        cooltime(scene, 3, 30);     // 데미지 반사
    }
}

export function ChooseNextSkill(scene){

    // [1] 보스가 아직 생성되지 않았으면 아무것도 하지 말기
    if (!BossInstance) return;

    // [2] 보스는 존재하지만 아직 초기화 전
    if (!BossInstance.isInit){
        BossInstance.isInit = true;
        initPattern(scene);
        return; // 초기화 직후에는 공격하지 않는다
    }

    // [3] 공격 중이면 대기
    if (BossInstance.isAttack) return;

    // [4] 패턴 큐가 비어 있으면 대기
    if (!BossInstance.nextPattern || BossInstance.nextPattern.size() === 0) return;

    BossInstance.isAttack = true;

    // 각 스킬에서 switch (스킬 사용 주기 증가)
    // scene.time.delayedCall(1400, () => {
    //     BossInstance.isAttack = false;
    // });

    const pattern = BossInstance.nextPattern.pop();
    CastSkill(pattern, scene);
}

export function cooltime(scene, target, cool){
    scene.time.delayedCall(cool * 1000, () => {
        BossInstance.nextPattern.push(target);
    })
}