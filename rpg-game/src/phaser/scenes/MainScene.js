import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
    this.textBar = "";
    this.skillState = [
      { cost: 10, cd: 800, nextAvailable: 0 }, // Q
      { cost: 20, cd: 3000, nextAvailable: 0 }, // W
      { cost: 15, cd: 2000, nextAvailable: 0 }, // E
      { cost: 5, cd: 500, nextAvailable: 0 }, // R
    ];
    // inventory & shortcuts (authoritative state)
    this.inventory = {
      money: 0,
      items: [
        // sample consumable to test (id must be unique)
        // { id:'potion1', name:'HP Potion', icon:'/assets/item.png', count:2, type:'consume', effect: { hp:50 } }
      ],
    };
    this.shortcutSlots = [null, null];
    // double-tap dash tracking
    this.lastArrowTap = { left: 0, right: 0, up: 0, down: 0 };
    this.dashCooldown = 300; // ms window for double-tap
  }

  preload() {
    this.load.image("map", "assets/map.png");
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("item", "assets/item.png");
  }

  create() {
    // world size
    this.worldWidth = 1600;
    this.worldHeight = 1200;
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // background
    const mapImg = this.add.image(0, 0, "map").setOrigin(0);
    mapImg.displayWidth = this.worldWidth;
    mapImg.displayHeight = this.worldHeight;

    // player
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.setCollideWorldBounds(true);
    this.player.maxHp = 120;
    this.player.hp = 120;
    this.player.maxMp = 60;
    this.player.mp = 60;
    this.player.expPercent = 0;
    this.player.level = 1;
    this.player.facing = new Phaser.Math.Vector2(0, -1); // default up

    this.player.isKnockback = false;
    this.player.knockbackVel = new Phaser.Math.Vector2(0, 0);
    this.player.knockbackDecay = 0.9; // 0~1, 1에 가까울수록 느리게 감속

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // monsters
    this.monsters = this.physics.add.group();
    for (let i = 0; i < 10; i++) {
      const m = this.monsters.create(
        Phaser.Math.Between(200, this.worldWidth - 200),
        Phaser.Math.Between(200, this.worldHeight - 200),
        "monster"
      );
      m.maxHp = 70;
      m.hp = m.maxHp;
      m.setCollideWorldBounds(true);
      m.isAggro = false;
      m.hpBar = this.add.graphics();
      m.body.setCircle(Math.max(m.width, m.height) / 2);
    }
    this.physics.add.collider(this.monsters, this.monsters);

    // bullets & items
    this.bullets = this.physics.add.group();
    this.items = this.physics.add.group();

    // overlap bullet->monster
    this.physics.add.overlap(
      this.bullets,
      this.monsters,
      this.onBulletHit,
      null,
      this
    );
    // player picks up item
    this.physics.add.overlap(
      this.player,
      this.items,
      this.onPickupItem,
      null,
      this
    );

    // player <-> monster collision (damage)
    this.physics.add.collider(
      this.player,
      this.monsters,
      this.onPlayerHitByMonster,
      null,
      this
    );

    // input keys
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Q,W,E,R");
    this.pageUp = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PAGE_UP
    );
    this.pageDown = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN
    );

    this.pageUp.on("down", () => this.useShortcut(0));
    this.pageDown.on("down", () => this.useShortcut(1));

    // timing: mp regen per sec
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.player.mp < this.player.maxMp)
          this.player.mp = Math.min(this.player.maxMp, this.player.mp + 2);
      },
    });
    this.input.keyboard.on("keydown", (event) => {
      if (event.code === "ArrowRight" && this.lastKey === "ArrowRight") {
        this.player.x += 100; // 오른쪽으로 빠르게 대쉬
      }
      if (event.code === "ArrowLeft" && this.lastKey === "ArrowLeft") {
        this.player.x -= 100;
      }
      if (event.code === "ArrowUp" && this.lastKey === "ArrowUp") {
        this.player.y -= 100;
      }
      if (event.code === "ArrowDown" && this.lastKey === "ArrowDown") {
        this.player.y += 100;
      }
      this.lastKey = event.code;

      // 일정 시간 후 lastKey 초기화
      setTimeout(() => {
        this.lastKey = null;
      }, 250);
    });

    // init skill nextAvailable
    this.skillState.forEach((s) => (s.nextAvailable = this.time.now));

    // sample starting item (so player can assign to shortcut)
    this.inventory.items.push({
      id: "potion_hp",
      name: "HP Potion",
      icon: "assets/item.png",
      count: 2,
      type: "consume",
      effect: { hp: 50 },
    });
    this.inventory.items.push({
      id: "mana_pot",
      name: "MP Potion",
      icon: "assets/item.png",
      count: 1,
      type: "consume",
      effect: { mp: 30 },
    });

    this.textBar = "스킬: Q(투사체) W(충격파) E(부채꼴) R(일반)";

    // for double-tap dash: track arrow key times through keyboard events
    this.input.keyboard.on("keydown", (event) => {
      this.handleArrowDoubleTap(event);
    });
  }

  // double tap detection -> dash
  handleArrowDoubleTap(event) {
    const now = this.time.now;
    const dt = 250; // ms window
    const dashDistance = 180;
    const dashSpeed = 900;
    if (event.code === "ArrowLeft") {
      if (now - this.lastArrowTap.left < this.dashCooldown) {
        this.doDash(new Phaser.Math.Vector2(-1, 0), dashDistance, dashSpeed);
      }
      this.lastArrowTap.left = now;
      this.player.facing.set(-1, 0);
    } else if (event.code === "ArrowRight") {
      if (now - this.lastArrowTap.right < this.dashCooldown) {
        this.doDash(new Phaser.Math.Vector2(1, 0), dashDistance, dashSpeed);
      }
      this.lastArrowTap.right = now;
      this.player.facing.set(1, 0);
    } else if (event.code === "ArrowUp") {
      if (now - this.lastArrowTap.up < this.dashCooldown) {
        this.doDash(new Phaser.Math.Vector2(0, -1), dashDistance, dashSpeed);
      }
      this.lastArrowTap.up = now;
      this.player.facing.set(0, -1);
    } else if (event.code === "ArrowDown") {
      if (now - this.lastArrowTap.down < this.dashCooldown) {
        this.doDash(new Phaser.Math.Vector2(0, 1), dashDistance, dashSpeed);
      }
      this.lastArrowTap.down = now;
      this.player.facing.set(0, 1);
    }
  }

  doDash(dirVec, distance, speed) {
    // temporary high velocity for short duration
    this.player.setVelocity(dirVec.x * speed, dirVec.y * speed);
    // small camera effect
    this.cameras.main.flash(80, 120, 120, 255);
    // after 150ms reduce velocity
    this.time.delayedCall(150, () => {
      this.player.setVelocity(0);
    });
    this.textBar = "대쉬!";
  }

  update(time, delta) {
    this.handleMovement();
    this.handleSkills(time);
    this.checkMonstersDeath();
    this.updateMonsters();
    this.updateMonsterHpBars();
  }

  handleMovement() {
    if (!this.player) return;

    // 넉백 처리
    if (this.player.isKnockback) {
      this.player.setVelocity(
        this.player.knockbackVel.x,
        this.player.knockbackVel.y
      );
      // 감속
      this.player.knockbackVel.scale(this.player.knockbackDecay);
      // 충분히 느려지면 넉백 종료
      if (this.player.knockbackVel.length() < 10) {
        this.player.isKnockback = false;
        this.player.setVelocity(0);
      }
      return; // 넉백 중 이동 입력 무시
    }

    const speed = 200;
    this.player.setVelocity(0);
    let moving = false;
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.facing.set(-1, 0);
      moving = true;
    }
    if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.facing.set(1, 0);
      moving = true;
    }
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.player.facing.set(0, -1);
      moving = true;
    }
    if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.player.facing.set(0, 1);
      moving = true;
    }
    if (!moving) this.player.setVelocity(0);
  }
  handleSkills(now) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.tryUseSkill(0, now);
    if (Phaser.Input.Keyboard.JustDown(this.keys.W)) this.tryUseSkill(1, now);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.tryUseSkill(2, now);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.tryUseSkill(3, now);
  }

  tryUseSkill(idx, now) {
    const s = this.skillState[idx];
    if (!s) return;
    if (now < s.nextAvailable) {
      this.textBar = "쿨다운 중입니다.";
      return;
    }
    if (this.player.mp < s.cost) {
      this.textBar = "MP 부족";
      return;
    }
    this.player.mp -= s.cost;
    s.nextAvailable = now + s.cd;

    // Skills use player.facing direction
    switch (idx) {
      case 0:
        this.skillProjectileFacing();
        break;
      case 1:
        this.skillShockwave();
        break;
      case 2:
        this.skillConeFacing();
        break;
      case 3:
        this.skillWeakFacing();
        break;
    }
  }

  // skill implementations use player.facing
  skillProjectileFacing() {
    const dir = this.player.facing.clone().normalize();
    if (dir.length() === 0) dir.set(0, -1);
    const b = this.bullets.create(
      this.player.x + dir.x * 20,
      this.player.y + dir.y * 20,
      "bullet"
    );
    b.setVelocity(dir.x * 550, dir.y * 550);
    b.damage = 30;
    this.cameras.main.shake(50, 0.002);
    this.textBar = "Q: 투사체";
  }

  skillShockwave() {
    const range = 140;
    const hits = [];
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      const dist = Phaser.Math.Distance.Between(
        m.x,
        m.y,
        this.player.x,
        this.player.y
      );
      if (dist <= range) hits.push(m);
    });
    hits.forEach((m) => {
      m.hp -= 35;
      this.onMonsterAggro(m);
      this.spawnHitEffect(m.x, m.y);
    });
    this.cameras.main.shake(160, 0.01);
    this.textBar = "W: 충격파";
  }

  skillConeFacing() {
    const base = this.player.facing.clone().normalize();
    if (base.length() === 0) base.set(0, -1);
    const num = 5;
    const spread = Phaser.Math.DEG_TO_RAD * 50;
    const baseAngle = Math.atan2(base.y, base.x);
    for (let i = 0; i < num; i++) {
      const t = i / (num - 1) - 0.5;
      const angle = baseAngle + t * spread;
      const dir = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle));
      const b = this.bullets.create(
        this.player.x + dir.x * 20,
        this.player.y + dir.y * 20,
        "bullet"
      );
      b.setVelocity(dir.x * 420, dir.y * 420);
      b.damage = 18;
    }
    this.textBar = "E: 부채꼴";
    this.cameras.main.shake(80, 0.005);
  }

  skillWeakFacing() {
    const dir = this.player.facing.clone().normalize();
    if (dir.length() === 0) dir.set(0, -1);
    const b = this.bullets.create(
      this.player.x + dir.x * 20,
      this.player.y + dir.y * 20,
      "bullet"
    );
    b.setVelocity(dir.x * 380, dir.y * 380);
    b.damage = 12;
    this.cameras.main.shake(30, 0.0015);
    this.textBar = "R: 일반";
  }

  onBulletHit(bullet, monster) {
    if (!bullet.active || !monster.active) return;
    const dmg = bullet.damage || 10;
    monster.hp -= dmg;
    bullet.destroy();
    this.spawnHitEffect(monster.x, monster.y);
    this.onMonsterAggro(monster);
  }

  spawnHitEffect(x, y) {
    const c = this.add.circle(x, y, 6, 0xffdd88, 0.9);
    this.time.delayedCall(130, () => c.destroy());
  }

  onMonsterAggro(monster) {
    if (!monster) return;
    monster.isAggro = true;
  }

  updateMonsters() {
    this.monsters.children.iterate((m) => {
      if (!m || !m.active) return;
      if (m.isAggro) {
        this.physics.moveToObject(m, this.player, 95);
      } else {
        m.setVelocity(0);
      }
    });
  }

  updateMonsterHpBars() {
    this.monsters.children.iterate((m) => {
      if (!m) return;
      const g = m.hpBar;
      g.clear();
      if (!m.active) return;
      const w = 40,
        h = 6;
      const x = m.x - w / 2,
        y = m.y - 28;
      g.fillStyle(0x000000, 0.6);
      g.fillRect(x, y, w, h);
      const pct = Phaser.Math.Clamp(m.hp / m.maxHp, 0, 1);
      g.fillStyle(0xff3333, 1);
      g.fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
    });
  }

  checkMonstersDeath() {
    // iterate copy because we may destroy inside
    const toRemove = [];
    this.monsters.children.iterate((m) => {
      if (!m) return;
      if (m.hp <= 0 && m.active) {
        // add exp & drops
        this.giveExpToPlayer(0.08); // example: each monster +8% exp
        // drop random money & possibly items
        const money = Phaser.Math.Between(5, 25);
        this.inventory.money += money;
        // drop item chance
        if (Phaser.Math.Between(0, 100) < 40) {
          // spawn item entity
          const it = this.items.create(m.x, m.y, "item");
          it.pickId = "drop_" + Date.now() + "_" + Phaser.Math.Between(0, 9999);
          it.pickDef = {
            id: "drop_hp",
            name: "Small Potion",
            icon: "assets/item.png",
            count: 1,
            type: "consume",
            effect: { hp: 30 },
          };
        }
        // delay destroy 500ms
        toRemove.push(m);
        // Visual: fade out
        m.setTint(0x333333);
        this.time.delayedCall(500, () => {
          if (m.hpBar) m.hpBar.clear();
          if (m && m.destroy) m.destroy();
        });
      }
    });
  }

  giveExpToPlayer(amountFraction) {
    // amountFraction: 0..1 of bar
    this.player.expPercent = (this.player.expPercent || 0) + amountFraction;
    if (this.player.expPercent >= 1) this.levelUp();
  }

  levelUp() {
    this.player.level = (this.player.level || 1) + 1;
    this.player.expPercent = 0;
    // increase stats
    this.player.maxHp += 15;
    this.player.hp = this.player.maxHp;
    this.player.maxMp += 8;
    this.player.mp = this.player.maxMp;
    this.textBar = `레벨 업! Lv ${this.player.level}`;
    this.cameras.main.flash(300, 200, 255, 200);
  }

  // item pickup: add to inventory and destroy item sprite
  onPickupItem(player, itemSprite) {
    if (!itemSprite.pickDef) return;
    const def = itemSprite.pickDef;
    // merge into inventory by id
    const exist = this.inventory.items.find((i) => i.id === def.id);
    if (exist) exist.count += def.count || 1;
    else this.inventory.items.push({ ...def });
    // small effect
    itemSprite.destroy();
    this.textBar = `획득: ${def.name}`;
  }

  // player hit by monster (contact)
  onPlayerHitByMonster(player, monster) {
    if (!player || !monster) return;

    if (!player._lastHitAt) player._lastHitAt = 0;
    const now = this.time.now;

    const invulDuration = 1000; // 1초 무적
    if (now - player._lastHitAt > invulDuration) {
      player.hp -= 10;
      player._lastHitAt = now;

      // 넉백 방향: (플레이어 - 몬스터)
      const dx = player.x - monster.x;
      const dy = player.y - monster.y;
      const dir = new Phaser.Math.Vector2(dx, dy).normalize();
      const knockbackPower = 400;

      player.isKnockback = true;
      player.knockbackVel.set(dir.x * knockbackPower, dir.y * knockbackPower);

      // 잠시 후 속도 멈춤
      this.time.delayedCall(300, () => {
        if (player) player.setVelocity(0);
        player.isKnockback = false;
      });

      // 시각 효과
      this.cameras.main.shake(250, 0.02);
      player.setTint(0xff6666); // 빨갛게 표시

      this.time.delayedCall(invulDuration, () => {
        if (player) player.clearTint(); // 무적 끝나면 원래대로
      });

      this.textBar = "적에게 피격!";
      if (player.hp <= 0) this.onPlayerDeath();
    }
  }

  onPlayerDeath() {
    this.textBar = "사망했습니다.";
    this.time.delayedCall(800, () => {
      this.player.hp = this.player.maxHp;
      this.player.x = 400;
      this.player.y = 300;
      this.cameras.main.flash(200);
    });
  }

  // consume item from inventory by index (called by Vue)
  useItemFromInventory(invIndex) {
    const item = this.inventory.items[invIndex];
    if (!item) return;
    if (item.type === "consume") {
      if (item.effect.hp) {
        this.player.hp = Math.min(
          this.player.maxHp,
          this.player.hp + item.effect.hp
        );
      }
      if (item.effect.mp) {
        this.player.mp = Math.min(
          this.player.maxMp,
          this.player.mp + item.effect.mp
        );
      }
      item.count -= 1;
      if (item.count <= 0) this.inventory.items.splice(invIndex, 1);
      this.textBar = `${item.name} 사용`;
    }
  }

  // use shortcut: slot 0 or 1 (triggered by PgUp/PgDn or Vue click)
  useShortcut(slotIdx) {
    const slot = this.shortcutSlots[slotIdx];
    if (!slot) {
      this.textBar = "단축키에 아이템 없음";
      return;
    }
    // find corresponding item in inventory
    const invIdx = this.inventory.items.findIndex((i) => i.id === slot.id);
    if (invIdx === -1) {
      this.textBar = "인벤토리에 아이템이 없습니다";
      return;
    }
    // use it
    this.useItemFromInventory(invIdx);
  }
}
