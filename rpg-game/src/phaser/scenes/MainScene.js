// MainScene.js
// - Phaser 3 기반 게임의 핵심 로직을 담당하는 씬(Scene)입니다.
// - 플레이어 이동/대쉬/피격 넉백, 몬스터 스폰/AI/피격/드롭, 스킬(2/4/5 리워크), 경험치/레벨업 등
// - 하드코딩 지양: 대부분의 수치를 cfg/skillDefs/monsterDefs/expCurve 로 분리하여 유지보수 용이

import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });

    // ─────────────────────────────────────────────────────────────
    // ⚙️ 전역 설정 (하드코딩 지양: 값은 여기서만 조정)
    // ─────────────────────────────────────────────────────────────
    this.cfg = {
      // 대쉬: "거리-기간 기반"으로 자연스러운 감속(Ease-out) 구현
      dash: {
        distance: 260,   // px (대쉬 총 이동거리)
        duration: 210,   // ms (대쉬 지속시간)
      },

      // 플레이어 피격 넉백 (자연감속)
      playerKB: {
        power: 680,      // 초기 넉백 힘 (크면 멀리 밀림)
        decay: 0.90,     // 매 프레임 감속 비율 (1에 가까울수록 오래 감속)
        stopSpeed: 10,   // 이 속도 이하면 넉백 종료
        invulMs: 1000,   // 피격 무적 시간(ms)
        contactShake: { duration: 250, intensity: 0.02 }, // 카메라 흔들림
      },

      // 몬스터 피격 넉백 (스킬 8, 기타 효과에서 사용)
      monsterKB: {
        power: 420,
        decay: 0.86,
        stopSpeed: 10,
      },

      // 스킬별 수치 (비주얼은 이미지 리소스로 표시; 미보유시 안전한 대체 이펙트)
      skills: {
        projectile: { speed: 550, dmg: 30 },
        cone:       { count: 5, spreadDeg: 50, speed: 420, dmg: 18 },
        weak:       { speed: 380, dmg: 12 },
        shockwave:  { radius: 140, dmg: 35 },            // 스킬2(자기 중심)
        projWave:   { radius: 140, dmg: 28, projDmg: 15 }, // 스킬4(투사체 명중 시)
        lightning:  { radius: 120, dmg: 60, range: 220 },  // 스킬5(전방 지정 거리)
        dot:        { projSpeed: 400, hitDmg: 10, tickDmg: 5, duration: 3000, interval: 1000 },
        freeze:     { projSpeed: 400, hitDmg: 8, freezeMs: 2000 },
        knockback:  { projSpeed: 450, hitDmg: 15, kbPower: 420 },
      },

      // 경험치 시스템 (정수 경험치 기반)
      expCurve: {
        base: 100,         // Lv1→2 필요 경험치의 기본값
        growth: 1.5,       // 필요 경험치 증가율 (지수형)
        // Lv n -> n+1 필요 경험치: floor(base * n^growth)
      },
    };

    // ─────────────────────────────────────────────────────────────
    // ⚡ 스킬 정의 (이름으로 슬롯에 배치 → 타입/소모/쿨다운 등은 여기서 주입)
    //    "이미지만 넣으면 되게" 해야 하는 것(2/4/5)은 type으로 구분하여 이펙트 생성
    // ─────────────────────────────────────────────────────────────
    this.skillDefs = {
      "Skill 1": { type: "projectile", cost: 10, cd: 800 },
      "Skill 2": { type: "shockwave",  cost: 16, cd: 3000 },     // 자기 중심 충격파(이미지로 표현)
      "Skill 3": { type: "cone",       cost: 12, cd: 1800 },
      "Skill 4": { type: "projShockwave", cost: 10, cd: 1200 },  // 투사체→명중 지점 충격파(이미지로 표현)
      "Skill 5": { type: "lightning",  cost: 20, cd: 4000 },     // 전방 지정 거리 낙뢰(이미지로 표현)
      "Skill 6": { type: "dot",        cost: 14, cd: 2500 },
      "Skill 7": { type: "freeze",     cost: 14, cd: 2500 },
      "Skill 8": { type: "knockback",  cost: 12, cd: 1400 },
    };

    // ─────────────────────────────────────────────────────────────
    // 🐉 몬스터 정의 (알고리즘 기반 능력치 산출)
    //  - baseHp/atk: 기준치
    //  - hpExp/atkExp: 레벨에 따라 지수성장 (예: level^hpExp)
    //  - minLevel/maxLevel: 스폰 레벨 범위
    //  - count: 스폰 개수
    //  - expBase/expExp: 처치 경험치 = floor(expBase * level^expExp)
    //  - dropTable: 아이템 드롭 (chance: 0~100)
    // ─────────────────────────────────────────────────────────────
    this.monsterDefs = [
      {
        key: "slime", name: "Slime",
        baseHp: 40,  hpExp: 1.10,
        baseAtk: 4,  atkExp: 1.05,
        minLevel: 1, maxLevel: 2, count: 5,
        expBase: 8, expExp: 1.00,
        dropTable: [
          { id: "potion_hp", name: "HP Potion", chance: 45 },
          { id: "gold_coin", name: "Gold Coin", chance: 80 },
        ],
      },
      {
        key: "orc", name: "Orc",
        baseHp: 90,  hpExp: 1.18,
        baseAtk: 12, atkExp: 1.10,
        minLevel: 2, maxLevel: 4, count: 4,
        expBase: 18, expExp: 1.08,
        dropTable: [
          { id: "mana_pot", name: "MP Potion", chance: 30 },
          { id: "gold_coin", name: "Gold Coin", chance: 90 },
        ],
      },
      {
        key: "dragonling", name: "Dragonling",
        baseHp: 220, hpExp: 1.25,
        baseAtk: 24,  atkExp: 1.18,
        minLevel: 4, maxLevel: 7, count: 3,
        expBase: 40, expExp: 1.12,
        dropTable: [
          { id: "rare_gem", name: "Rare Gem", chance: 18 },
          { id: "elixir",   name: "Elixir",   chance: 10 },
        ],
      },
    ];

    // Vue 측과 동기화되는 상태
    this.skillSlots = [null, null, null, null]; // Q W E R
    this.itemShortcutSlots = [null, null];      // PgUp, PgDn
    this.inventory = { money: 0, items: [] };

    // 더블탭 대쉬 트래킹
    this.lastArrowTap = { left: 0, right: 0, up: 0, down: 0 };
    this.dashCooldown = 300; // ms

    this.textBar = "";
  }

  // ─────────────────────────────────────────────────────────────
  // 리소스 로드
  //  - shockwave / lightning 이미지를 제공하면 자동 사용
  //  - 제공 안 해도 그래픽스로 대체 이펙트 그려주어 안전
  // ─────────────────────────────────────────────────────────────
  preload() {
    this.load.image("map", "assets/map.png");
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("item", "assets/item.png");

    // 이펙트 이미지(선택)
    this.load.image("shockwave", "assets/effect_shockwave.png");
    this.load.image("lightning", "assets/effect_lightning.png");
  }

  // ─────────────────────────────────────────────────────────────
  // 초기화
  // ─────────────────────────────────────────────────────────────
  create() {
    // 월드/카메라
    this.worldWidth = 1600;
    this.worldHeight = 1200;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    const mapImg = this.add.image(0, 0, "map").setOrigin(0);
    mapImg.displayWidth = this.worldWidth;
    mapImg.displayHeight = this.worldHeight;

    // 플레이어
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);
    this.player.maxHp = 120;
    this.player.hp = 120;
    this.player.maxMp = 60;
    this.player.mp = 60;

    // 경험치(정수) 및 레벨업 곡선
    this.player.level = 1;
    this.player.exp = 0;
    this.player.nextExp = this.calcNextExp(this.player.level);

    // 이동/상태
    this.player.facing = new Phaser.Math.Vector2(0, -1);
    // 피격 넉백 상태
    this.player.isKnockback = false;
    this.player.knockbackVel = new Phaser.Math.Vector2(0, 0);
    // 대쉬 상태 (거리-기간 기반)
    this.player.dash = { active: false, dir: new Phaser.Math.Vector2(0, 0), start: 0, duration: this.cfg.dash.duration, v0: 0 };

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // 몬스터/총알/아이템 그룹
    this.monsters = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.items = this.physics.add.group();

    // 몬스터 스폰 (알고리즘 기반 능력치 산출)
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
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.player.mp < this.player.maxMp) {
          this.player.mp = Math.min(this.player.maxMp, this.player.mp + 2);
        }
      },
    });

    // 시작 아이템 샘플(테스트용)
    this.inventory.items.push(
      { id: "potion_hp", name: "HP Potion", icon: "assets/item.png", count: 2, type: "consume", effect: { hp: 50 } },
      { id: "mana_pot",  name: "MP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { mp: 30 } }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 경험치 곡선 (알고리즘)
  // nextExp(level) = floor(base * level^growth)
  // ─────────────────────────────────────────────────────────────
  calcNextExp(level) {
    const { base, growth } = this.cfg.expCurve;
    return Math.floor(base * Math.pow(level, growth));
  }

  // ─────────────────────────────────────────────────────────────
  // 몬스터 스탯 산출 (알고리즘)
  // HP = floor(baseHp * level^hpExp), ATK = floor(baseAtk * level^atkExp)
  // expReward = floor(expBase * level^expExp)
  // ─────────────────────────────────────────────────────────────
  makeMonsterFromDef(def) {
    const level = Phaser.Math.Between(def.minLevel, def.maxLevel);
    const maxHp = Math.floor(def.baseHp * Math.pow(level, def.hpExp));
    const atk   = Math.floor(def.baseAtk * Math.pow(level, def.atkExp));
    const expRw = Math.floor(def.expBase * Math.pow(level, def.expExp));
    return { level, maxHp, atk, expReward: expRw };
  }

  // ─────────────────────────────────────────────────────────────
  // 몬스터 스폰(여러 타입 * 여러 마리): 이름/레벨 라벨 + HP바 포함
  // ─────────────────────────────────────────────────────────────
  spawnMonsters() {
    this.monsterDefs.forEach((def) => {
      for (let i = 0; i < def.count; i++) {
        const m = this.monsters.create(
          Phaser.Math.Between(200, this.worldWidth - 200),
          Phaser.Math.Between(200, this.worldHeight - 200),
          "monster"
        );
        const stats = this.makeMonsterFromDef(def);
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
          hpBar: this.add.graphics(),
          label: this.add.text(0, 0, `Lv${stats.level} ${def.name}`, { fontSize: "12px", fill: "#fff" }),
        });
        m.setCollideWorldBounds(true);
        m.body.setCircle(Math.max(m.width, m.height) / 2);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Vue에서 호출하는 공개 메서드(슬롯/사용)
  // ─────────────────────────────────────────────────────────────
  setSkillSlots(slots) {
    const now = this.time?.now || 0;
    this.skillSlots = (slots || []).slice(0, 4).map((s) => {
      if (!s) return null;
      // 이름만 넘어와도 기본 스펙(cost/cd/type)을 주입
      const base = this.skillDefs[s.name] || { type: "projectile", cost: 0, cd: 1000 };
      return { ...s, ...base, nextAvailable: now };
    });
  }

  setItemSlots(itemSlots) {
    this.itemShortcutSlots = (itemSlots || []).slice(0, 2).map((i) => (i ? { id: i.id, name: i.name, icon: i.icon } : null));
  }

  useSkill(idx) {
    const slot = this.skillSlots[idx];
    if (!slot) return;
    this.tryUseSkill(slot, this.time.now);
  }

  useItemShortcut(idx) {
    const slot = this.itemShortcutSlots[idx];
    if (!slot) return (this.textBar = "단축키에 아이템 없음");
    const invIdx = this.inventory.items.findIndex((i) => i.id === slot.id);
    if (invIdx === -1) return (this.textBar = "인벤토리에 아이템이 없습니다");
    this.useItemFromInventory(invIdx);
  }

  // ─────────────────────────────────────────────────────────────
  // 프레임 루프
  // ─────────────────────────────────────────────────────────────
  update() {
    const now = this.time.now;
    this.handleKnockback();   // 피격 넉백 최우선
    this.handleDash(now);     // 대쉬(진행 중이면 이동 입력 무시)
    this.handleMovement();    // 일반 이동
    this.handleSkills(now);   // QWER 스킬 입력
    this.updateMonsters();    // 몬스터 AI/상태
    this.checkMonstersDeath();// 사망/드롭/경험치 처리
    this.updateMonsterHud();  // HP바/라벨 위치 갱신
  }

  // ─────────────────────────────────────────────────────────────
  // 입력: 더블탭 → 대쉬
  // ─────────────────────────────────────────────────────────────
  handleArrowDoubleTap(event) {
    const now = this.time.now;
    const setDash = (vec) => (this.doDash(vec), this.player.facing.copy(vec));
    if (event.code === "ArrowLeft")  { if (now - this.lastArrowTap.left  < this.dashCooldown) setDash(new Phaser.Math.Vector2(-1, 0)); this.lastArrowTap.left = now; }
    if (event.code === "ArrowRight") { if (now - this.lastArrowTap.right < this.dashCooldown) setDash(new Phaser.Math.Vector2( 1, 0)); this.lastArrowTap.right = now; }
    if (event.code === "ArrowUp")    { if (now - this.lastArrowTap.up    < this.dashCooldown) setDash(new Phaser.Math.Vector2( 0,-1)); this.lastArrowTap.up = now; }
    if (event.code === "ArrowDown")  { if (now - this.lastArrowTap.down  < this.dashCooldown) setDash(new Phaser.Math.Vector2( 0, 1)); this.lastArrowTap.down = now; }
  }

  // 거리/기간 기반 대쉬(선형 감속)
  doDash(dir) {
    const D = this.cfg.dash.distance;
    const T = this.cfg.dash.duration;           // ms
    const v0 = (2 * D) / (T / 1000);            // ∫ v0*(1 - t/T) dt = D
    this.player.dash.active = true;
    this.player.dash.dir = dir.clone().normalize();
    this.player.dash.start = this.time.now;
    this.player.dash.duration = T;
    this.player.dash.v0 = v0;
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
    const progress = Phaser.Math.Clamp(elapsed / d.duration, 0, 1);
    const speed = d.v0 * (1 - progress);
    this.player.setVelocity(d.dir.x * speed, d.dir.y * speed);
  }

  // 플레이어 피격 넉백(자연감속)
  handleKnockback() {
    if (!this.player.isKnockback) return;
    this.player.setVelocity(this.player.knockbackVel.x, this.player.knockbackVel.y);
    this.player.knockbackVel.scale(this.cfg.playerKB.decay);
    if (this.player.knockbackVel.length() < this.cfg.playerKB.stopSpeed) {
      this.player.isKnockback = false;
      this.player.setVelocity(0);
    }
  }

  // 일반 이동(넉백/대쉬 중이면 무시)
  handleMovement() {
    if (this.player.isKnockback || this.player.dash.active) return;
    const speed = 200;
    this.player.setVelocity(0);
    if (this.cursors.left.isDown)  { this.player.setVelocityX(-speed); this.player.facing.set(-1, 0); }
    if (this.cursors.right.isDown) { this.player.setVelocityX( speed); this.player.facing.set( 1, 0); }
    if (this.cursors.up.isDown)    { this.player.setVelocityY(-speed); this.player.facing.set( 0,-1); }
    if (this.cursors.down.isDown)  { this.player.setVelocityY( speed); this.player.facing.set( 0, 1); }
  }

  // QWER 스킬 입력 처리
  handleSkills(now) {
    ["Q", "W", "E", "R"].forEach((k, idx) => {
      if (Phaser.Input.Keyboard.JustDown(this.keys[k])) {
        const s = this.skillSlots[idx];
        if (!s) return;
        this.tryUseSkill(s, now);
      }
    });
  }

  // 스킬 실행(쿨다운/MP 체크 → 타입별 분기)
  tryUseSkill(slot, now) {
    if (now < (slot.nextAvailable || 0)) return (this.textBar = "쿨다운 중");
    if (this.player.mp < (slot.cost || 0)) return (this.textBar = "MP 부족");
    this.player.mp -= slot.cost;
    slot.nextAvailable = now + (slot.cd || 0);

    const t = slot.type;
    if (t === "projectile")     return this.skillProjectileFacing();
    if (t === "shockwave")      return this.skillShockwave();             // 스킬2
    if (t === "cone")           return this.skillConeFacing();
    if (t === "projShockwave")  return this.skillProjShockwave();         // 스킬4
    if (t === "lightning")      return this.skillLightning();             // 스킬5
    if (t === "dot")            return this.skillDoTProjectile();
    if (t === "freeze")         return this.skillFreezeProjectile();
    if (t === "knockback")      return this.skillKnockbackProjectile();
  }

  // ─────────────────────────────────────────────────────────────
  // 스킬 구현
  // ─────────────────────────────────────────────────────────────

  // 1) 기본 투사체 (전방으로 강한 탄환)
  skillProjectileFacing() {
    const { speed, dmg } = this.cfg.skills.projectile;
    const dir = this.player.facing.clone().normalize();
    const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * speed, dir.y * speed);
    b.damage = dmg;
    this.textBar = "투사체";
  }

  // 2) 자기 중심 충격파 (이미지만 넣으면 표현 완료)
  skillShockwave() {
    const { radius, dmg } = this.cfg.skills.shockwave;
    this.spawnShockwave(this.player.x, this.player.y, radius, dmg);
    this.textBar = "충격파";
  }

  // 3) 부채꼴 다발 발사
  skillConeFacing() {
    const { count, spreadDeg, speed, dmg } = this.cfg.skills.cone;
    const base = this.player.facing.clone().normalize();
    const baseAngle = Math.atan2(base.y, base.x);
    const spreadRad = Phaser.Math.DEG_TO_RAD * spreadDeg;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1) - 0.5;
      const angle = baseAngle + t * spreadRad;
      const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
      b.setVelocity(dir.x * speed, dir.y * speed);
      b.damage = dmg;
    }
    this.textBar = "부채꼴";
  }

  // 4) 투사체 + 명중 지점 충격파 (이미지로 가시화)
  skillProjShockwave() {
    const { projDmg } = this.cfg.skills.projWave;
    const dir = this.player.facing.clone().normalize();
    const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * 380, dir.y * 380);
    b.damage = projDmg;
    b.onHit = (monster) => {
      const { radius, dmg } = this.cfg.skills.projWave;
      this.spawnShockwave(monster.x, monster.y, radius, dmg);
    };
    this.textBar = "투사체+충격파";
  }

  // 5) 전방 지정 거리 낙뢰 (이미지로 가시화)
  //    - 마우스 타겟팅 없이 플레이어 전방 "range" 지점에 떨어짐
  skillLightning() {
    const { range, radius, dmg } = this.cfg.skills.lightning;
    const dir = this.player.facing.clone().normalize();
    const tx = this.player.x + dir.x * range;
    const ty = this.player.y + dir.y * range;
    this.spawnLightning(tx, ty, radius, dmg);
    this.textBar = "낙뢰!";
  }

  // 6) DOT 투사체 (즉시 피해 + 지속 피해)
  skillDoTProjectile() {
    const { projSpeed, hitDmg, tickDmg, duration, interval } = this.cfg.skills.dot;
    const dir = this.player.facing.clone().normalize();
    const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * projSpeed, dir.y * projSpeed);
    b.damage = hitDmg;
    b.dot = { damage: tickDmg, duration, interval };
    this.textBar = "DOT 투사체";
  }

  // 7) 빙결 투사체 (명중 시 일정 시간 이동 불가)
  skillFreezeProjectile() {
    const { projSpeed, hitDmg, freezeMs } = this.cfg.skills.freeze;
    const dir = this.player.facing.clone().normalize();
    const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * projSpeed, dir.y * projSpeed);
    b.damage = hitDmg;
    b.onHit = (monster) => {
      monster.isFrozen = true;
      monster.setVelocity(0, 0);
      this.time.delayedCall(freezeMs, () => { if (monster && monster.active) monster.isFrozen = false; });
    };
    this.textBar = "빙결 투사체";
  }

  // 8) 넉백 투사체 (몬스터가 플레이어 넉백처럼 자연스럽게 밀림)
  skillKnockbackProjectile() {
    const { projSpeed, hitDmg } = this.cfg.skills.knockback;
    const dir = this.player.facing.clone().normalize();
    const b = this.bullets.create(this.player.x + dir.x * 20, this.player.y + dir.y * 20, "bullet");
    b.setVelocity(dir.x * projSpeed, dir.y * projSpeed);
    b.damage = hitDmg;
    b.onHit = (monster) => {
      monster.isKnockback = true;
      monster.knockbackVel = dir.clone().scale(this.cfg.monsterKB.power);
    };
    this.textBar = "넉백 투사체";
  }

  // ─────────────────────────────────────────────────────────────
  // 이펙트 스포너 (이미지 있으면 이미지, 없으면 안전한 그래픽 대체)
  // ─────────────────────────────────────────────────────────────
  // 충격파: 데미지 적용 + 비주얼
  spawnShockwave(x, y, radius, dmg) {
    // 비주얼: 이미지가 있으면 이미지, 없으면 원형 그래픽
    if (this.textures.exists("shockwave")) {
      const img = this.add.image(x, y, "shockwave").setScale(1).setAlpha(0.9);
      this.tweens.add({ targets: img, scale: 1.6, alpha: 0.0, duration: 240, onComplete: () => img.destroy() });
    } else {
      const g = this.add.circle(x, y, 6, 0x88e0ff, 0.9);
      this.tweens.add({
        targets: g, radius: radius, alpha: 0.0, duration: 240,
        onComplete: () => g.destroy()
      });
    }

    // 판정: 원형 범위 내 몬스터에 피해
    const hits = [];
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
      if (dist <= radius) hits.push(m);
    });
    hits.forEach((m) => { m.hp -= dmg; this.onMonsterAggro(m); this.spawnHitFlash(m.x, m.y); });
    this.cameras.main.shake(140, 0.01);
  }

  // 낙뢰: 데미지 적용 + 비주얼
  spawnLightning(x, y, radius, dmg) {
    if (this.textures.exists("lightning")) {
      const img = this.add.image(x, y, "lightning").setAlpha(0.95).setScale(1.1);
      this.tweens.add({ targets: img, alpha: 0.0, duration: 260, onComplete: () => img.destroy() });
    } else {
      // 이미지 없을 때: 위에서 아래로 빠르게 떨어지는 라인 + 임팩트 원
      const line = this.add.rectangle(x, y - 160, 4, 160, 0xeeeeff, 0.9);
      const boom = this.add.circle(x, y, 8, 0xffffaa, 0.9);
      this.tweens.add({ targets: line, y: y, duration: 120, onComplete: () => line.destroy() });
      this.tweens.add({ targets: boom, radius: radius, alpha: 0.0, duration: 240, onComplete: () => boom.destroy() });
    }

    // 판정
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      const dist = Phaser.Math.Distance.Between(m.x, m.y, x, y);
      if (dist <= radius) { m.hp -= dmg; this.onMonsterAggro(m); this.spawnHitFlash(m.x, m.y); }
    });
    this.cameras.main.shake(160, 0.012);
  }

  // 작은 히트 플래시
  spawnHitFlash(x, y) {
    const c = this.add.circle(x, y, 6, 0xffdd88, 0.9);
    this.time.delayedCall(130, () => c.destroy());
  }

  // ─────────────────────────────────────────────────────────────
  // 전투/피격/상태
  // ─────────────────────────────────────────────────────────────
  onBulletHit(bullet, monster) {
    if (!bullet.active || !monster.active) return;
    const dmg = bullet.damage || 10;
    monster.hp -= dmg;
    this.onMonsterAggro(monster);
    this.spawnHitFlash(monster.x, monster.y);

    if (typeof bullet.onHit === "function") bullet.onHit(monster); // 충격파 등 커스텀
    if (bullet.dot) this.applyDot(monster, bullet.dot);           // DOT 부여

    bullet.destroy();
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

  onMonsterAggro(monster) {
    if (!monster) return;
    monster.isAggro = true;
  }

  // 몬스터 AI/상태 갱신(빙결/넉백/어그로)
  updateMonsters() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;

      if (m.isKnockback) {
        if (!m.knockbackVel) { m.isKnockback = false; return; }
        m.setVelocity(m.knockbackVel.x, m.knockbackVel.y);
        m.knockbackVel.scale(this.cfg.monsterKB.decay);
        if (m.knockbackVel.length() < this.cfg.monsterKB.stopSpeed) {
          m.isKnockback = false;
          m.setVelocity(0);
        }
        return; // 넉백 중에는 다른 행동 X
      }

      if (m.isFrozen) {
        m.setVelocity(0);
        return;
      }

      if (m.isAggro) this.physics.moveToObject(m, this.player, 95);
      else m.setVelocity(0);
    });
  }

  // 몬스터 HUD(HP바 + Lv/이름 라벨) 갱신
  updateMonsterHud() {
    this.monsters.children.iterate((m) => {
      if (!m) return;
      const g = m.hpBar; if (!g) return;
      g.clear();
      if (!m.active) return;

      const w = 56, h = 6;
      const x = m.x - w / 2, y = m.y - 34;
      g.fillStyle(0x000000, 0.6).fillRect(x, y, w, h);
      const pct = Phaser.Math.Clamp(m.hp / m.maxHp, 0, 1);
      g.fillStyle(0xff3333, 1).fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);

      if (m.label) m.label.setPosition(m.x - w / 2, y - 14);
    });
  }

  // 몬스터 사망/드롭/경험치 처리
  checkMonstersDeath() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      if (m.hp > 0) return;

      // 경험치: 알고리즘 기반 expReward(정수)를 더함
      this.giveExpToPlayer(m.expReward);

      // 드롭: 테이블 기반
      (m.dropTable || []).forEach((drop) => {
        if (Phaser.Math.Between(0, 100) < drop.chance) {
          // 골드 코인은 돈 증가, 그 외는 인벤토리 아이템으로 스폰
          if (drop.id === "gold_coin") {
            this.inventory.money += Phaser.Math.Between(5, 20);
          } else {
            const it = this.items.create(m.x, m.y, "item");
            it.pickDef = this.resolveDropItem(drop);
          }
        }
      });

      // 시각 처리 후 제거
      m.setTint(0x333333);
      if (m.hpBar) m.hpBar.clear();
      if (m.label) m.label.destroy();
      this.time.delayedCall(400, () => { if (m && m.destroy) m.destroy(); });
    });
  }

  // 드롭 아이템 정의 → 실제 아이템 오브젝트로 변환
  resolveDropItem(drop) {
    // 필요한 경우 여기서 아이템별 효과 정의 확장
    if (drop.id === "potion_hp") return { id: "potion_hp", name: "HP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 30 } };
    if (drop.id === "mana_pot")  return { id: "mana_pot",  name: "MP Potion", icon: "assets/item.png", count: 1, type: "consume", effect: { mp: 20 } };
    if (drop.id === "elixir")    return { id: "elixir",    name: "Elixir",    icon: "assets/item.png", count: 1, type: "consume", effect: { hp: 50, mp: 30 } };
    if (drop.id === "rare_gem")  return { id: "rare_gem",  name: "Rare Gem",  icon: "assets/item.png", count: 1, type: "misc" };
    // 기본(미정의): 소모품 없이 표시만
    return { id: drop.id, name: drop.name || drop.id, icon: "assets/item.png", count: 1, type: "misc" };
  }

  // 플레이어가 아이템 줍기 → 인벤토리에 합쳐 넣음
  onPickupItem(player, itemSprite) {
    if (!itemSprite.pickDef) return;
    const def = itemSprite.pickDef;
    const exist = this.inventory.items.find((i) => i.id === def.id);
    if (exist) exist.count += def.count || 1;
    else this.inventory.items.push({ ...def });
    itemSprite.destroy();
    this.textBar = `획득: ${def.name}`;
  }

  // 플레이어 피격(몬스터 접촉) → 개별 몬스터 atk 적용 + 넉백
  onPlayerHitByMonster(player, monster) {
    if (!player || !monster) return;

    if (!player._lastHitAt) player._lastHitAt = 0;
    const now = this.time.now;
    const invul = this.cfg.playerKB.invulMs;

    if (now - player._lastHitAt > invul) {
      // 데미지 = 몬스터 공격력
      player.hp -= monster.atk;
      player._lastHitAt = now;

      // 넉백 방향 = (플레이어 - 몬스터) 정규화
      const dir = new Phaser.Math.Vector2(player.x - monster.x, player.y - monster.y).normalize();
      player.isKnockback = true;
      player.knockbackVel.set(dir.x * this.cfg.playerKB.power, dir.y * this.cfg.playerKB.power);

      // 시각 효과
      this.cameras.main.shake(this.cfg.playerKB.contactShake.duration, this.cfg.playerKB.contactShake.intensity);
      player.setTint(0xff6666);
      this.time.delayedCall(invul, () => { if (player) player.clearTint(); });

      this.textBar = "적에게 피격!";
      if (player.hp <= 0) this.onPlayerDeath();
    }
  }

  onPlayerDeath() {
    this.textBar = "사망했습니다.";
    this.time.delayedCall(800, () => {
      this.player.hp = this.player.maxHp;
      this.player.x = 400; this.player.y = 300;
      this.cameras.main.flash(200);
    });
  }

  // 인벤토리에서 아이템 사용
  useItemFromInventory(invIndex) {
    const item = this.inventory.items[invIndex];
    if (!item) return;
    if (item.type === "consume") {
      if (item.effect?.hp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.effect.hp);
      if (item.effect?.mp) this.player.mp = Math.min(this.player.maxMp, this.player.mp + item.effect.mp);
      item.count -= 1;
      if (item.count <= 0) this.inventory.items.splice(invIndex, 1);
      this.textBar = `${item.name} 사용`;
    }
  }

  // 경험치 획득 → 레벨업 체크
  giveExpToPlayer(expAmount) {
    this.player.exp += expAmount;
    while (this.player.exp >= this.player.nextExp) {
      this.player.exp -= this.player.nextExp;
      this.levelUp(); // 레벨업 시 nextExp 갱신
    }
  }

  // 레벨업: 능력치 상승 + 다음 필요 경험치 갱신
  levelUp() {
    this.player.level += 1;
    // 다음 레벨업 요구치 (알고리즘)
    this.player.nextExp = this.calcNextExp(this.player.level);

    // 능력치 보상(예시)
    this.player.maxHp += 20; this.player.hp = this.player.maxHp;
    this.player.maxMp += 10; this.player.mp = this.player.maxMp;

    this.textBar = `레벨 업! Lv ${this.player.level}`;
    this.cameras.main.flash(300, 200, 255, 200);
  }
}
