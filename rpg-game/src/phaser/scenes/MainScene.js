// MainScene.js
// - Phaser 3 게임의 핵심 로직을 담는 씬(Scene)
// - 요구사항:
//   1) OOP 스킬 시스템 (스킬 레벨업/포인트/데미지·MP 스케일링)
//   2) 플레이어 레벨업 시 MP 증가 보장 + 스킬 포인트 지급
//   3) 대쉬: 더블탭 윈도우(시간 제한) + 쿨타임
//   4) 이미지가 있으면 스프라이트, 없으면 안전한 대체 그래픽 표시

import Phaser from "phaser";

/* ===============================
 *  공용 설정(하드코딩 지양: 여기만 고치면 전체 반영)
 * =============================== */
const CFG = {
  world: { width: 1600, height: 1200 },
  moveSpeed: 200,

  // 대쉬: 더블탭 윈도우·쿨타임·거리·기간
  dash: {
    doubleTapWindowMs: 250, // 이 시간 안에 같은 방향키를 두 번 눌러야 대쉬
    cooldownMs: 1500,       // 대쉬 후 재사용 대기 시간
    distance: 280,          // 총 이동 거리(px)
    durationMs: 220,        // 유지 시간(ms) — 선형 감속
    cameraFlash: { duration: 80, r: 120, g: 120, b: 255 },
  },

  // 플레이어 피격 넉백
  playerKB: {
    power: 700,      // 초기 넉백 힘(클수록 멀리 밀림)
    decay: 0.90,     // 매 프레임 감속 비율
    stopSpeed: 10,   // 이 속도 이하면 멈춤
    invulMs: 1000,   // 피격 후 무적 시간(ms)
    shake: { duration: 250, intensity: 0.02 },
  },

  // 몬스터 넉백
  monsterKB: {
    power: 440,
    decay: 0.86,
    stopSpeed: 10,
  },

  // 경험치 곡선
  expCurve: {
    base: 100,
    growth: 1.5, // nextExp(level) = floor(base * level^growth)
  },

  // 스킬 공통 스케일링
  skillScaling: {
    dmgPerLevel: 0.15,  // 레벨당 +15% 데미지
    costPerLevel: 0.10, // 레벨당 +10% 마나 소모
  },

  // 각 스킬의 기본 파라미터(속도/범위/기본 데미지/기본 MP 비용 등)
  skillBase: {
    projectile: { speed: 550, baseDmg: 30, baseCost: 10, cd: 800 },
    cone:       { count: 5, spreadDeg: 50, speed: 420, baseDmg: 18, baseCost: 12, cd: 1800 },
    weak:       { speed: 380, baseDmg: 12, baseCost: 6,  cd: 700 }, // 참고용(슬롯엔 안 씀)
    shockwave:  { radius: 140, baseDmg: 35, baseCost: 16, cd: 3000 },
    projWave:   { radius: 140, baseDmg: 28, baseCost: 10, cd: 1200, projDmg: 15 },
    lightning:  { radius: 120, baseDmg: 60, baseCost: 20, cd: 4000, range: 220 },
    dot:        { projSpeed: 400, hitDmg: 10, tickDmg: 5, duration: 3000, interval: 1000, baseCost: 14, cd: 2500 },
    freeze:     { projSpeed: 400, hitDmg: 8, freezeMs: 2000, baseCost: 14, cd: 2500 },
    knockback:  { projSpeed: 450, hitDmg: 15, kbPower: 420, baseCost: 12, cd: 1400 },
  },

  // 몬스터 정의(알고리즘으로 레벨별 능력치 산출)
  monsters: [
    {
      key: "slime",
      name: "Slime",
      // HP/공격력/경험치 보상은 레벨에 따라 성장(지수식)
      baseHp: 40,  hpExp: 1.10,
      baseAtk: 4,  atkExp: 1.05,
      expBase: 8,  expExp: 1.00,
      minLevel: 1, maxLevel: 2,
      count: 5,
      dropTable: [
        { id: "potion_hp", name: "HP Potion", chance: 45 },
        { id: "gold_coin", name: "Gold Coin", chance: 80 },
      ],
    },
    {
      key: "orc",
      name: "Orc",
      baseHp: 90,  hpExp: 1.18,
      baseAtk: 12, atkExp: 1.10,
      expBase: 18, expExp: 1.08,
      minLevel: 2, maxLevel: 4,
      count: 4,
      dropTable: [
        { id: "mana_pot", name: "MP Potion", chance: 30 },
        { id: "gold_coin", name: "Gold Coin", chance: 90 },
      ],
    },
    {
      key: "dragonling",
      name: "Dragonling",
      baseHp: 220, hpExp: 1.25,
      baseAtk: 24,  atkExp: 1.18,
      expBase: 40,  expExp: 1.12,
      minLevel: 4, maxLevel: 7,
      count: 3,
      dropTable: [
        { id: "rare_gem", name: "Rare Gem", chance: 18 },
        { id: "elixir",   name: "Elixir",   chance: 10 },
      ],
    },
  ],
};

/* ===============================
 * 공용 유틸: 수치 계산
 * =============================== */
function calcNextExp(level) {
  return Math.floor(CFG.expCurve.base * Math.pow(level, CFG.expCurve.growth));
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

/* ===============================
 * 플레이어 스탯(경험치/레벨/스킬포인트)
 * =============================== */
class PlayerStats {
  constructor() {
    this.level = 1;
    this.exp = 0;
    this.nextExp = calcNextExp(this.level);
    this.maxHp = 120; this.hp = 120;
    this.maxMp = 60;  this.mp = 60;
    this.skillPoints = 0; // 레벨업으로 획득
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.nextExp) {
      this.exp -= this.nextExp;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.nextExp = calcNextExp(this.level);

    // 성장치: HP/MP 모두 증가 (요구사항)
    this.maxHp += 20;
    this.maxMp += 10;
    this.hp = this.maxHp;
    this.mp = this.maxMp;

    // 스킬 포인트 지급
    this.skillPoints += 1;
  }
}

/* ===============================
 * OOP 스킬 시스템
 *  - 공통: level, getDamage(), getManaCost(), canCast(), onCast()
 * =============================== */
class Skill {
  constructor(key, base) {
    this.key = key;              // "projectile", "shockwave" 등
    this.level = 1;              // 스킬 레벨(기본 1)
    this.base = base;            // CFG.skillBase[key]
    this.onCooldownUntil = 0;    // 쿨타임 관리용
  }

  // 스킬 레벨업(스킬 포인트를 씀) — 외부에서 호출
  levelUp() { this.level += 1; }

  // 레벨 기반 데미지/마나 소모 스케일링
  scaledDamage(baseDmg) {
    const mul = 1 + CFG.skillScaling.dmgPerLevel * (this.level - 1);
    return Math.floor(baseDmg * mul);
  }
  scaledCost(baseCost) {
    const mul = 1 + CFG.skillScaling.costPerLevel * (this.level - 1);
    return Math.floor(baseCost * mul);
  }

  // 공통 체크: MP/쿨타임
  canCast(scene) {
    const now = scene.time.now;
    const cost = this.getManaCost();
    if (now < this.onCooldownUntil) { scene.textBar = "쿨다운 중"; return false; }
    if (scene.playerStats.mp < cost) { scene.textBar = "MP 부족"; return false; }
    return true;
  }

  // 시그니처
  getDamage() { return 0; }
  getManaCost() { return 0; }
  getCooldown() { return this.base.cd || 1000; }
  cast(/*scene, caster*/) { /* override */ }

  // 공통 캐스팅 래퍼: MP 차감 + 쿨타임 세팅
  tryCast(scene, caster) {
    if (!this.canCast(scene)) return;
    const cost = this.getManaCost();
    scene.playerStats.mp = Math.max(0, scene.playerStats.mp - cost);
    this.onCooldownUntil = scene.time.now + this.getCooldown();
    this.cast(scene, caster);
  }
}

/* ───────── 개별 스킬 구현 ───────── */

class ProjectileSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * this.base.speed, dir.y * this.base.speed);
    b.damage = this.getDamage();
    scene.textBar = `투사체 (Lv${this.level})`;
  }
}

class ShockwaveSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    scene.spawnShockwave(caster.x, caster.y, this.base.radius, this.getDamage());
    scene.textBar = `충격파 (Lv${this.level})`;
  }
}

class ConeSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const base = caster.facing.clone().normalize();
    const baseAngle = Math.atan2(base.y, base.x);
    const spreadRad = Phaser.Math.DEG_TO_RAD * this.base.spreadDeg;
    for (let i = 0; i < this.base.count; i++) {
      const t = i / (this.base.count - 1) - 0.5;
      const angle = baseAngle + t * spreadRad;
      const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
      b.setVelocity(dir.x * this.base.speed, dir.y * this.base.speed);
      b.damage = this.getDamage();
    }
    scene.textBar = `부채꼴 (Lv${this.level})`;
  }
}

class ProjShockwaveSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }              // 충격파 데미지
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  getProjDamage() { return this.scaledDamage(this.base.projDmg || 10); }    // 투사체 데미지
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * 380, dir.y * 380);
    b.damage = this.getProjDamage();
    b.onHit = (monster) => {
      scene.spawnShockwave(monster.x, monster.y, this.base.radius, this.getDamage());
    };
    scene.textBar = `투사체+충격파 (Lv${this.level})`;
  }
}

class LightningSkill extends Skill {
  getDamage() { return this.scaledDamage(this.base.baseDmg); }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const tx = caster.x + dir.x * this.base.range;
    const ty = caster.y + dir.y * this.base.range;
    scene.spawnLightning(tx, ty, this.base.radius, this.getDamage());
    scene.textBar = `낙뢰 (Lv${this.level})`;
  }
}

class DotSkill extends Skill {
  getDamage() { return this.base.hitDmg; } // DOT은 즉시 피해는 고정, 틱딜이 핵심
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();
    b.dot = { damage: this.base.tickDmg + Math.floor((this.level - 1) * 2), duration: this.base.duration, interval: this.base.interval };
    scene.textBar = `DOT 투사체 (Lv${this.level})`;
  }
}

class FreezeSkill extends Skill {
  getDamage() { return this.base.hitDmg; }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();
    b.onHit = (monster) => {
      monster.isFrozen = true;
      monster.setVelocity(0, 0);
      scene.time.delayedCall(this.base.freezeMs, () => { if (monster && monster.active) monster.isFrozen = false; });
    };
    scene.textBar = `빙결 투사체 (Lv${this.level})`;
  }
}

class KnockbackSkill extends Skill {
  getDamage() { return this.base.hitDmg; }
  getManaCost() { return this.scaledCost(this.base.baseCost); }
  cast(scene, caster) {
    const dir = caster.facing.clone().normalize();
    const b = scene.bullets.create(caster.x + dir.x * 20, caster.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * this.base.projSpeed, dir.y * this.base.projSpeed);
    b.damage = this.getDamage();
    b.onHit = (monster) => {
      monster.isKnockback = true;
      monster.knockbackVel = dir.clone().scale(CFG.monsterKB.power);
    };
    scene.textBar = `넉백 투사체 (Lv${this.level})`;
  }
}

/* ===============================
 * MainScene
 * =============================== */
export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });

    this.textBar = "";

    // 대쉬 더블탭 기록 및 쿨타임
    this.lastArrowTap = { ArrowLeft: 0, ArrowRight: 0, ArrowUp: 0, ArrowDown: 0 };
    this.lastDashAt = 0; // 마지막 대쉬 시각(ms)
  }

  preload() {
    // 맵/플레이어/기본 리소스
    this.load.image("map", "assets/map.png");
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("item", "assets/item.png");

    // 이펙트 이미지(있으면 사용, 없으면 그래픽 대체)
    this.load.image("shockwave", "assets/effect_shockwave.png");
    this.load.image("lightning", "assets/effect_lightning.png");
  }

  create() {
    // 월드/카메라
    this.physics.world.setBounds(0, 0, CFG.world.width, CFG.world.height);
    this.cameras.main.setBounds(0, 0, CFG.world.width, CFG.world.height);

    const map = this.add.image(0, 0, "map").setOrigin(0);
    map.displayWidth = CFG.world.width;
    map.displayHeight = CFG.world.height;

    // 플레이어 + 스탯
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);
    this.player.facing = new Phaser.Math.Vector2(0, -1);
    this.player.isKnockback = false;
    this.player.knockbackVel = new Phaser.Math.Vector2(0, 0);
    this.player.dash = { active: false, dir: new Phaser.Math.Vector2(0, 0), start: 0, duration: CFG.dash.durationMs, v0: 0 };

    this.playerStats = new PlayerStats(); // HP/MP/EXP/레벨/스킬포인트

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // 그룹
    this.monsters = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.items = this.physics.add.group();

    // 몬스터 생성
    this.spawnMonsters();

    // 충돌/오버랩
    this.physics.add.collider(this.monsters, this.monsters);
    this.physics.add.overlap(this.bullets, this.monsters, this.onBulletHit, null, this);
    this.physics.add.overlap(this.player, this.items, this.onPickupItem, null, this);
    this.physics.add.collider(this.player, this.monsters, this.onPlayerHitByMonster, null, this);

    // 입력
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Q,W,E,R");
    const pageUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_UP);
    const pageDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN);
    pageUp.on("down", () => this.useItemShortcut(0));
    pageDown.on("down", () => this.useItemShortcut(1));
    this.input.keyboard.on("keydown", (e) => this.handleArrowDoubleTap(e));

    // MP 리젠
    this.time.addEvent({
      delay: 1000, loop: true,
      callback: () => {
        if (this.playerStats.mp < this.playerStats.maxMp) {
          this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + 2);
        }
      },
    });

    // 인벤토리(테스트용)
    this.inventory = { money: 0, items: [] };
    this.inventory.items.push(
      { id: "potion_hp", name: "HP Potion", icon: "assets/item.png", count: 2, type: "consume", effect: { hp: 50 } },
      { id: "mana_pot",  name: "MP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { mp: 30 } }
    );

    // OOP 스킬 인스턴스(레벨업 가능)
    this.skills = {
      "Skill 1": new ProjectileSkill("projectile", CFG.skillBase.projectile),
      "Skill 2": new ShockwaveSkill("shockwave",   CFG.skillBase.shockwave),
      "Skill 3": new ConeSkill("cone",             CFG.skillBase.cone),
      "Skill 4": new ProjShockwaveSkill("projWave",CFG.skillBase.projWave),
      "Skill 5": new LightningSkill("lightning",   CFG.skillBase.lightning),
      "Skill 6": new DotSkill("dot",               CFG.skillBase.dot),
      "Skill 7": new FreezeSkill("freeze",         CFG.skillBase.freeze),
      "Skill 8": new KnockbackSkill("knockback",   CFG.skillBase.knockback),
    };

    // 단축키 슬롯(QWER) — Vue에서 설정/변경 (여기선 빈 슬롯)
    this.skillSlots = [null, null, null, null]; // 슬롯에는 "Skill 1" 같은 키 문자열을 넣음
    this.itemShortcutSlots = [null, null];      // PgUp/PgDn

    // Vue와 싱크되는 텍스트바
    this.textBar = "게임 시작!";
  }

  /* ───────── 몬스터 생성/알고리즘 능력치 ───────── */

  makeMonsterStats(def) {
    const level = Phaser.Math.Between(def.minLevel, def.maxLevel);
    const maxHp = Math.floor(def.baseHp * Math.pow(level, def.hpExp));
    const atk   = Math.floor(def.baseAtk * Math.pow(level, def.atkExp));
    const expRw = Math.floor(def.expBase * Math.pow(level, def.expExp));
    return { level, maxHp, atk, expReward: expRw };
  }

  spawnMonsters() {
    CFG.monsters.forEach((def) => {
      for (let i = 0; i < def.count; i++) {
        const m = this.monsters.create(
          Phaser.Math.Between(200, CFG.world.width - 200),
          Phaser.Math.Between(200, CFG.world.height - 200),
          "monster"
        );
        const stats = this.makeMonsterStats(def);
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
          hpBar: this.add.graphics(),
          label: this.add.text(0, 0, `Lv${stats.level} ${def.name}`, { fontSize: "12px", fill: "#fff" }),
        });
        m.setCollideWorldBounds(true);
        m.body.setCircle(Math.max(m.width, m.height) / 2);
      }
    });
  }

  /* ───────── Vue에서 호출할 API: 슬롯/스킬레벨업 ───────── */

  setSkillSlots(slots) {
    // slots = [{name:"Skill 1", icon:...}, ...] 또는 null
    this.skillSlots = (slots || []).slice(0, 4).map(s => s ? s.name : null);
  }

  setItemSlots(itemSlots) {
    this.itemShortcutSlots = (itemSlots || []).slice(0, 2).map(i => (i ? { id: i.id, name: i.name, icon: i.icon } : null));
  }

  // 스킬 포인트로 스킬 레벨업 (Vue에서 호출)
  upgradeSkillByName(skillName) {
    const skill = this.skills[skillName];
    if (!skill) return false;
    if (this.playerStats.skillPoints <= 0) return false;
    skill.levelUp();
    this.playerStats.skillPoints -= 1;
    this.textBar = `${skillName} 스킬 레벨업! (Lv${skill.level})`;
    return true;
  }

  // 슬롯의 스킬을 사용(QWER 클릭/키보드)
  useSkill(slotIdx) {
    const name = this.skillSlots[slotIdx];
    if (!name) return;
    const skill = this.skills[name];
    if (!skill) return;
    skill.tryCast(this, this.player);
  }

  useItemShortcut(idx) {
    const slot = this.itemShortcutSlots[idx];
    if (!slot) return (this.textBar = "단축키에 아이템 없음");
    const invIdx = this.inventory.items.findIndex(i => i.id === slot.id);
    if (invIdx === -1) return (this.textBar = "인벤토리에 아이템이 없습니다");
    this.useItemFromInventory(invIdx);
  }

  /* ───────── 프레임 루프 ───────── */

  update() {
    const now = this.time.now;
    this.handlePlayerKnockback();
    this.handleDash(now);
    this.handleMovement();
    this.updateMonsters();
    this.checkMonstersDeath();
    this.updateMonsterHud();

     // 🔹 QWER 키 입력 처리
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.useSkill(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.W)) this.useSkill(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSkill(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.useSkill(3);
  }
  

  /* ───────── 이동/대쉬/넉백 ───────── */

  handleMovement() {
    if (this.player.isKnockback || this.player.dash.active) return;
    this.player.setVelocity(0);
    if (this.cursors.left.isDown)  { this.player.setVelocityX(-CFG.moveSpeed); this.player.facing.set(-1, 0); }
    if (this.cursors.right.isDown) { this.player.setVelocityX( CFG.moveSpeed); this.player.facing.set( 1, 0); }
    if (this.cursors.up.isDown)    { this.player.setVelocityY(-CFG.moveSpeed); this.player.facing.set( 0,-1); }
    if (this.cursors.down.isDown)  { this.player.setVelocityY( CFG.moveSpeed); this.player.facing.set( 0, 1); }
  }

  handleArrowDoubleTap(e) {
    const now = this.time.now;
    // 쿨타임 중이면 무시
    if (now - this.lastDashAt < CFG.dash.cooldownMs) return;

    const code = e.code;
    if (!this.lastArrowTap.hasOwnProperty(code)) return;

    const last = this.lastArrowTap[code] || 0;
    this.lastArrowTap[code] = now;

    // 더블탭 윈도우 내에서만 대쉬 허용 (버그 방지)
    if (now - last <= CFG.dash.doubleTapWindowMs) {
      // 방향 벡터 확정
      const dir = (code === "ArrowLeft") ? new Phaser.Math.Vector2(-1, 0)
                : (code === "ArrowRight")? new Phaser.Math.Vector2( 1, 0)
                : (code === "ArrowUp")   ? new Phaser.Math.Vector2( 0,-1)
                : (code === "ArrowDown") ? new Phaser.Math.Vector2( 0, 1)
                : null;
      if (!dir) return;
      this.doDash(dir);
      this.lastDashAt = now; // 쿨타임 시작
    } else {
      // 첫 탭 기록만 갱신(대쉬 없음)
    }
  }

  doDash(dir) {
    // 감속형: ∫ v0*(1 - t/T) dt = distance → v0 = 2*D / (T/1000)
    const D = CFG.dash.distance;
    const T = CFG.dash.durationMs;
    const v0 = (2 * D) / (T / 1000);

    this.player.dash.active = true;
    this.player.dash.dir = dir.clone().normalize();
    this.player.dash.start = this.time.now;
    this.player.dash.duration = T;
    this.player.dash.v0 = v0;

    // 카메라 이펙트
    const c = CFG.dash.cameraFlash;
    this.cameras.main.flash(c.duration, c.r, c.g, c.b);
    this.textBar = "대쉬!";
  }

  handleDash(now) {
    const d = this.player.dash;
    if (!d.active) return;
    const elapsed = now - d.start;
    if (elapsed >= d.duration) {
      d.active = false;
      this.player.setVelocity(0);
      return;
    }
    const progress = clamp01(elapsed / d.duration);
    const speed = d.v0 * (1 - progress); // 선형 감속
    this.player.setVelocity(d.dir.x * speed, d.dir.y * speed);
  }

  handlePlayerKnockback() {
    if (!this.player.isKnockback) return;
    this.player.setVelocity(this.player.knockbackVel.x, this.player.knockbackVel.y);
    this.player.knockbackVel.scale(CFG.playerKB.decay);
    if (this.player.knockbackVel.length() < CFG.playerKB.stopSpeed) {
      this.player.isKnockback = false;
      this.player.setVelocity(0);
    }
  }

  /* ───────── 전투/피격/사망/드롭 ───────── */

  onBulletHit(bullet, monster) {
    if (!bullet.active || !monster.active) return;
    const dmg = bullet.damage || 10;
    monster.hp -= dmg;
    this.spawnHitFlash(monster.x, monster.y);
    this.onMonsterAggro(monster);

    // 특수효과(DOT/빙결/넉백 등)
    if (typeof bullet.onHit === "function") bullet.onHit(monster);
    if (bullet.dot) this.applyDot(monster, bullet.dot);

    bullet.destroy();
  }

  onPickupItem(player, itemSprite) {
    if (!itemSprite.pickDef) return;   // pickDef 없으면 무시
    const def = itemSprite.pickDef;

    // 인벤토리에 추가
    const exist = this.inventory.items.find(i => i.id === def.id);
    if (exist) exist.count += def.count || 1;
    else this.inventory.items.push({ ...def });

    itemSprite.destroy(); // 맵에서 제거
    this.textBar = `${def.name} 획득`;
  }


  onPlayerHitByMonster(player, monster) {
    if (!player || !monster) return;
    if (!player._lastHitAt) player._lastHitAt = 0;
    const now = this.time.now;
    if (now - player._lastHitAt < CFG.playerKB.invulMs) return;

    // 데미지 = 몬스터 공격력
    this.playerStats.hp -= monster.atk;
    player._lastHitAt = now;

    // 넉백: (플레이어 - 몬스터) 방향
    const dir = new Phaser.Math.Vector2(player.x - monster.x, player.y - monster.y).normalize();
    player.isKnockback = true;
    player.knockbackVel.set(dir.x * CFG.playerKB.power, dir.y * CFG.playerKB.power);

    // 카메라 흔들림/틴트
    this.cameras.main.shake(CFG.playerKB.shake.duration, CFG.playerKB.shake.intensity);
    player.setTint(0xff6666);
    this.time.delayedCall(CFG.playerKB.invulMs, () => { if (player) player.clearTint(); });

    this.textBar = "적에게 피격!";
    if (this.playerStats.hp <= 0) this.onPlayerDeath();
  }

  onPlayerDeath() {
    this.textBar = "사망했습니다.";
    this.time.delayedCall(800, () => {
      this.playerStats.hp = this.playerStats.maxHp;
      this.player.x = 400; this.player.y = 300;
      this.cameras.main.flash(200);
    });
  }

  applyDot(monster, dot) {
    const ticks = Math.max(1, Math.floor(dot.duration / dot.interval));
    for (let i = 1; i <= ticks; i++) {
      this.time.delayedCall(dot.interval * i, () => {
        if (!monster || !monster.active) return;
        monster.hp -= dot.damage;
        this.spawnHitFlash(monster.x, monster.y);
        this.onMonsterAggro(monster);
      });
    }
  }

  onMonsterAggro(monster) { monster.isAggro = true; }

  updateMonsters() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;

      // 넉백 중
      if (m.isKnockback) {
        m.setVelocity(m.knockbackVel.x, m.knockbackVel.y);
        m.knockbackVel.scale(CFG.monsterKB.decay);
        if (m.knockbackVel.length() < CFG.monsterKB.stopSpeed) {
          m.isKnockback = false; m.setVelocity(0);
        }
        return;
      }

      // 빙결 중
      if (m.isFrozen) { m.setVelocity(0); return; }

      // 어그로
      if (m.isAggro) this.physics.moveToObject(m, this.player, 95);
      else m.setVelocity(0);
    });
  }

  updateMonsterHud() {
    this.monsters.children.iterate((m) => {
      if (!m) return;
      const g = m.hpBar; if (!g) return;
      g.clear();
      if (!m.active) return;

      const w = 56, h = 6;
      const x = m.x - w / 2, y = m.y - 34;
      g.fillStyle(0x000000, 0.6).fillRect(x, y, w, h);
      const pct = clamp01(m.hp / m.maxHp);
      g.fillStyle(0xff3333, 1).fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);

      if (m.label) m.label.setPosition(m.x - w / 2, y - 14);
    });
  }

  checkMonstersDeath() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      if (m.hp > 0) return;

      // 경험치 보상 (정수)
      this.playerStats.addExp(m.expReward);

      // 드롭
      (m.dropTable || []).forEach((drop) => {
        if (Phaser.Math.Between(0, 100) < drop.chance) {
          if (drop.id === "gold_coin") {
            this.inventory.money += Phaser.Math.Between(5, 20);
          } else {
            const it = this.items.create(m.x, m.y, "item");
            it.pickDef = this.resolveDropItem(drop);
          }
        }
      });

      // 제거
      m.setTint(0x333333);
      if (m.hpBar) m.hpBar.clear();
      if (m.label) m.label.destroy();
      this.time.delayedCall(400, () => { if (m && m.destroy) m.destroy(); });
    });
  }

  resolveDropItem(drop) {
    if (drop.id === "potion_hp") return { id: "potion_hp", name: "HP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 30 } };
    if (drop.id === "mana_pot")  return { id: "mana_pot",  name: "MP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { mp: 20 } };
    if (drop.id === "elixir")    return { id: "elixir",    name: "Elixir",    icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 50, mp: 30 } };
    if (drop.id === "rare_gem")  return { id: "rare_gem",  name: "Rare Gem",  icon: "assets/item.png", count: 1, type: "misc" };
    return { id: drop.id, name: drop.name || drop.id, icon: "assets/item.png", count: 1, type: "misc" };
  }

  useItemFromInventory(invIndex) {
    const item = this.inventory.items[invIndex];
    if (!item) return;
    if (item.type === "consume") {
      if (item.effect?.hp) this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + item.effect.hp);
      if (item.effect?.mp) this.playerStats.mp = Math.min(this.playerStats.maxMp, this.playerStats.mp + item.effect.mp);
      item.count -= 1;
      if (item.count <= 0) this.inventory.items.splice(invIndex, 1);
      this.textBar = `${item.name} 사용`;
    }
  }

  /* ───────── 이펙트(이미지/대체 그래픽) ───────── */

  spawnShockwave(x, y, radius, dmg) {
    if (this.textures.exists("shockwave")) {
      const img = this.add.image(x, y, "shockwave").setScale(1).setAlpha(0.9);
      this.tweens.add({ targets: img, scale: 1.6, alpha: 0.0, duration: 240, onComplete: () => img.destroy() });
    } else {
      const g = this.add.circle(x, y, 6, 0x88e0ff, 0.9);
      this.tweens.add({ targets: g, radius, alpha: 0.0, duration: 240, onComplete: () => g.destroy() });
    }

    // 판정
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
      if (dist <= radius) { m.hp -= dmg; this.spawnHitFlash(m.x, m.y); this.onMonsterAggro(m); }
    });
    this.cameras.main.shake(120, 0.01);
  }

  spawnLightning(x, y, radius, dmg) {
    if (this.textures.exists("lightning")) {
      const img = this.add.image(x, y, "lightning").setScale(1.1).setAlpha(0.95);
      this.tweens.add({ targets: img, alpha: 0.0, duration: 260, onComplete: () => img.destroy() });
    } else {
      const line = this.add.rectangle(x, y - 160, 4, 160, 0xeeeeff, 0.9);
      const boom = this.add.circle(x, y, 8, 0xffffaa, 0.9);
      this.tweens.add({ targets: line, y: y, duration: 120, onComplete: () => line.destroy() });
      this.tweens.add({ targets: boom, radius: radius, alpha: 0.0, duration: 240, onComplete: () => boom.destroy() });
    }

    // 판정
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
      if (dist <= radius) { m.hp -= dmg; this.spawnHitFlash(m.x, m.y); this.onMonsterAggro(m); }
    });
    this.cameras.main.shake(140, 0.012);
  }

  spawnHitFlash(x, y) {
    const c = this.add.circle(x, y, 6, 0xffdd88, 0.9);
    this.time.delayedCall(130, () => c.destroy());
  }
}
