import Phaser from "phaser";
import { CFG } from "../config/Config.js";
import { clamp01 } from "../utils/MathUtils.js";
import { PlayerStats } from "../player/PlayerStats.js";
import { createDefaultSkills } from "../skills/index.js";
import {
  spawnShockwave,
  spawnLightning,
  spawnHitFlash,
} from "../effects/Effects.js";
import { resolveDropItem, useItemFromInventory } from "../items/Inventory.js";
import { spawnMonsters } from "../entities/MonsterFactory.js";
import { FloatingText } from "../effects/FloatingText.js";

// export default : 모듈로써 외부 접근을 허용하는 코드
// Scene : 화면 구성 및 논리 처리 요소
export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });

    this.textBar = "";
    this.lastArrowTap = {
      ArrowLeft: 0,
      ArrowRight: 0,
      ArrowUp: 0,
      ArrowDown: 0,
    };
    this.lastDashAt = 0;
  }

  // preload() : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
  preload() {
    this.load.image("map", "assets/map.png");
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("item", "assets/item.png");

    this.load.image("shockwave", "assets/effect_shockwave.png");
    this.load.image("lightning", "assets/effect_lightning.png");
  }

  // create() : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
  create() {
    this.physics.world.setBounds(0, 0, CFG.world.width, CFG.world.height);
    this.cameras.main.setBounds(0, 0, CFG.world.width, CFG.world.height);

    const map = this.add.image(0, 0, "map").setOrigin(0);
    map.displayWidth = CFG.world.width;
    map.displayHeight = CFG.world.height;

    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);
    this.player.facing = new Phaser.Math.Vector2(0, -1);
    this.player.isKnockback = false;
    this.player.knockbackVel = new Phaser.Math.Vector2(0, 0);
    this.player.dash = {
      active: false,
      dir: new Phaser.Math.Vector2(0, 0),
      start: 0,
      duration: CFG.dash.durationMs,
      v0: 0,
    };

    this.playerStats = new PlayerStats();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.monsters = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.items = this.physics.add.group();

    spawnMonsters(this);

    this.physics.add.collider(this.monsters, this.monsters);
    this.physics.add.overlap(
      this.bullets,
      this.monsters,
      this.onBulletHit,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.items,
      this.onPickupItem,
      null,
      this
    );
    this.physics.add.collider(
      this.player,
      this.monsters,
      this.onPlayerHitByMonster,
      null,
      this
    );

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Q,W,E,R");
    const pageUp = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PAGE_UP
    );
    const pageDown = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN
    );
    pageUp.on("down", () => this.useItemShortcut(0));
    pageDown.on("down", () => this.useItemShortcut(1));
    this.input.keyboard.on("keydown", (e) => this.handleArrowDoubleTap(e));

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.playerStats.mp < this.playerStats.maxMp) {
          this.playerStats.mp = Math.min(
            this.playerStats.maxMp,
            this.playerStats.mp + 2
          );
        }
      },
    });

    this.inventory = { money: 0, items: [] };
    this.inventory.items.push(
      {
        id: "potion_hp",
        name: "HP Potion",
        icon: "assets/item.png",
        count: 2,
        type: "consume",
        effect: { hp: 50 },
      },
      {
        id: "mana_pot",
        name: "MP Potion",
        icon: "assets/item.png",
        count: 1,
        type: "consume",
        effect: { mp: 30 },
      }
    );

    this.skills = createDefaultSkills();

    this.skillSlots = [null, null, null, null];
    this.itemShortcutSlots = [null, null];

    this.textBar = "게임 시작!";

    this.spawnShockwave = (x, y, radius, dmg) =>
      spawnShockwave(this, x, y, radius, dmg);
    this.spawnLightning = (x, y, radius, dmg) =>
      spawnLightning(this, x, y, radius, dmg);
    this.spawnHitFlash = (x, y) => spawnHitFlash(this, x, y);
  }

  setSkillSlots(slots) {
    this.skillSlots = (slots || []).slice(0, 4).map((s) => (s ? s.name : null));
  }

  setItemSlots(itemSlots) {
    this.itemShortcutSlots = (itemSlots || [])
      .slice(0, 2)
      .map((i) => (i ? { id: i.id, name: i.name, icon: i.icon } : null));
  }

  upgradeSkillByName(skillName) {
    const skill = this.skills[skillName];
    if (!skill) return false;
    if (this.playerStats.skillPoints <= 0) return false;
    skill.levelUp();
    this.playerStats.skillPoints -= 1;
    this.textBar = `${skillName} 스킬 레벨업! (Lv${skill.level})`;
    return true;
  }

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
    const invIdx = this.inventory.items.findIndex((i) => i.id === slot.id);
    if (invIdx === -1) return (this.textBar = "인벤토리에 아이템이 없습니다");
    useItemFromInventory(this, invIdx);
  }

  // update() : 유니티의 update()와 동일 (프레임 단위 호출)
  update() {
    const now = this.time.now;
    this.handlePlayerKnockback();
    this.handleDash(now);
    this.handleMovement();
    this.updateMonsters();
    this.checkMonstersDeath();
    this.updateMonsterHud();

    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.useSkill(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.W)) this.useSkill(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSkill(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.useSkill(3);
  }

  handleMovement() {
    if (this.player.isKnockback || this.player.dash.active) return;
    this.player.setVelocity(0);
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-CFG.moveSpeed);
      this.player.facing.set(-1, 0);
    }
    if (this.cursors.right.isDown) {
      this.player.setVelocityX(CFG.moveSpeed);
      this.player.facing.set(1, 0);
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-CFG.moveSpeed);
      this.player.facing.set(0, -1);
    }
    if (this.cursors.down.isDown) {
      this.player.setVelocityY(CFG.moveSpeed);
      this.player.facing.set(0, 1);
    }
  }

  handleArrowDoubleTap(e) {
    const now = this.time.now;
    if (now - this.lastDashAt < CFG.dash.cooldownMs) return;

    const code = e.code;
    if (!this.lastArrowTap.hasOwnProperty(code)) return;

    const last = this.lastArrowTap[code] || 0;
    this.lastArrowTap[code] = now;

    if (now - last <= CFG.dash.doubleTapWindowMs) {
      const dir =
        code === "ArrowLeft"
          ? new Phaser.Math.Vector2(-1, 0)
          : code === "ArrowRight"
          ? new Phaser.Math.Vector2(1, 0)
          : code === "ArrowUp"
          ? new Phaser.Math.Vector2(0, -1)
          : code === "ArrowDown"
          ? new Phaser.Math.Vector2(0, 1)
          : null;
      if (!dir) return;
      this.doDash(dir);
      this.lastDashAt = now;
    }
  }

  doDash(dir) {
    const D = CFG.dash.distance;
    const T = CFG.dash.durationMs;
    const v0 = (2 * D) / (T / 1000);

    this.player.dash.active = true;
    this.player.dash.dir = dir.clone().normalize();
    this.player.dash.start = this.time.now;
    this.player.dash.duration = T;
    this.player.dash.v0 = v0;

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
    const progress = Phaser.Math.Clamp(elapsed / d.duration, 0, 1);
    const speed = d.v0 * (1 - progress);
    this.player.setVelocity(d.dir.x * speed, d.dir.y * speed);
  }

  showDamageText(target, damage, color = "#fff") {
    if (!target || !target.x || !target.y) return;

    const txt = new FloatingText(
      this,
      target.x,
      target.y - 20,
      `-${damage}`,
      color
    );
  }

  handlePlayerKnockback() {
    if (!this.player.isKnockback) return;
    this.player.setVelocity(
      this.player.knockbackVel.x,
      this.player.knockbackVel.y
    );
    this.player.knockbackVel.scale(CFG.playerKB.decay);
    if (this.player.knockbackVel.length() < CFG.playerKB.stopSpeed) {
      this.player.isKnockback = false;
      this.player.setVelocity(0);
    }
  }

  // 몬스터 피격시에 호출
  onBulletHit = (bullet, monster) => {
    if (!bullet || !bullet.active || !monster || !monster.active) return;

    // 중복 히트/재귀 방지를 위해 먼저 비활성화
    if (bullet.body) bullet.body.enable = false;

    const dmg = bullet.damage || 10;
    monster.hp -= dmg;
    this.spawnHitFlash(monster.x, monster.y);

    // 데미지 텍스트 (크리티컬 판정 로직이 있는 경우에)
    // if (isCritical) {
    //   this.showDamageText(monster, damage, "#ffff66"); // 노란색
    // } else {
    //   this.showDamageText(monster, damage, "#ffffff");
    // }
    this.showDamageText(monster, dmg, "#ffffff");
    // 몬스터 어그로
    this.onMonsterAggro(monster);

    // 스킬 전용 onHit는 예외 방지용 try/catch
    try {
      if (typeof bullet.onHit === "function") bullet.onHit(monster);
    } catch (err) {
      console.error("[onHit error]", err);
    }

    if (bullet.dot) this.applyDot(monster, bullet.dot);

    bullet.destroy();
  };

  onPickupItem = (player, itemSprite) => {
    if (!itemSprite.pickDef) return;
    const def = itemSprite.pickDef;

    const exist = this.inventory.items.find((i) => i.id === def.id);
    if (exist) exist.count += def.count || 1;
    else this.inventory.items.push({ ...def });

    itemSprite.destroy();
    this.textBar = `${def.name} 획득`;
  };

  // 유저가 몬스터에게 피격 시 호출
  onPlayerHitByMonster = (player, monster) => {
    if (!player || !monster) return;

    if (!player._lastHitAt) player._lastHitAt = 0;
    const now = this.time.now;
    if (now - player._lastHitAt < CFG.playerKB.invulMs) return;

    this.playerStats.hp -= monster.atk;

    // 피격 데미지 텍스트 (빨간색)
    this.showDamageText(player, monster.atk, "#ff3333");
    player._lastHitAt = now;
    this.textBar = "Tlqkf";
    const dir = new Phaser.Math.Vector2(
      player.x - monster.x,
      player.y - monster.y
    ).normalize();
    player.isKnockback = true;
    player.knockbackVel.set(
      dir.x * CFG.playerKB.power,
      dir.y * CFG.playerKB.power
    );

    this.cameras.main.shake(
      CFG.playerKB.shake.duration,
      CFG.playerKB.shake.intensity
    );
    player.setTint(0xff6666);
    this.time.delayedCall(CFG.playerKB.invulMs, () => {
      if (player) player.clearTint();
    });

    this.textBar = "적에게 피격!";
    if (this.playerStats.hp <= 0) this.onPlayerDeath();
  };

  onPlayerDeath() {
    this.textBar = "사망했습니다.";
    this.time.delayedCall(800, () => {
      this.playerStats.hp = this.playerStats.maxHp;
      this.player.x = 400;
      this.player.y = 300;
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

  onMonsterAggro(monster) {
    monster.isAggro = true;
  }

  updateMonsters() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;

      if (m.isKnockback) {
        m.setVelocity(m.knockbackVel.x, m.knockbackVel.y);
        m.knockbackVel.scale(CFG.monsterKB.decay);
        if (m.knockbackVel.length() < CFG.monsterKB.stopSpeed) {
          m.isKnockback = false;
          m.setVelocity(0);
        }
        return;
      }

      if (m.isFrozen) {
        m.setVelocity(0);
        return;
      }

      if (m.isAggro) this.physics.moveToObject(m, this.player, 95);
      else m.setVelocity(0);
    });
  }

  updateMonsterHud() {
    this.monsters.children.iterate((m) => {
      if (!m) return;
      const g = m.hpBar;
      if (!g) return;
      g.clear();
      if (!m.active) return;

      const w = 56,
        h = 6;
      const x = m.x - w / 2,
        y = m.y - 34;
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

      this.playerStats.addExp(m.expReward);

      (m.dropTable || []).forEach((drop) => {
        if (Phaser.Math.Between(0, 100) < drop.chance) {
          if (drop.id === "gold_coin") {
            this.inventory.money += Phaser.Math.Between(5, 20);
          } else {
            const it = this.items.create(m.x, m.y, "item");
            it.pickDef = resolveDropItem(drop);
          }
        }
      });

      m.setTint(0x333333);
      if (m.hpBar) m.hpBar.clear();
      if (m.label) m.label.destroy();
      this.time.delayedCall(400, () => {
        if (m && m.destroy) m.destroy();
      });
    });
  }
}
