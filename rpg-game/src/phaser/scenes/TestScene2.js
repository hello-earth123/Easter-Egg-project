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
import { spawnMonsters } from "../entities/TestMonsterFactory.js";
import { FloatingText } from "../effects/FloatingText.js";

// export default : 모듈로써 외부 접근을 허용하는 코드
// Scene : 화면 구성 및 논리 처리 요소
export default class TestScene2 extends Phaser.Scene {
    // constructor() : 클래스 생성자 함수로 Scene 객체 생성
    constructor() {
        super({ key: "TestScene2" });

        this.textBar = "";
        this.lastArrowTap = {
            ArrowRight: 0,
            ArrowLeft: 0,
            ArrowUp: 0,
            ArrowDown: 0,
        };
        this.lastDashAt = 0;

        this.monsterData = {
            hidden: 10,
            rabbit: 1
        };

        this.minLevel = 1;
        this.maxLevel = 1;

        this.count = 0;

        // 캐릭터 방향 true: right
        this.current = false;
    }

    // TODO: preload, create의 중첩되는 요소에 대한 singleton 처리
    // preload() : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
    preload() {
        this.load.image("map", "assets/map.png");
        this.load.image("player", "/static/assets/player.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.image("item", "/static/assets/item.png");
        this.load.image("shockwave", "assets/effect_shockwave.png");


        for (const key of Object.keys(this.monsterData)) {
            // assets 경로는 key에 맞게 문자열 생성
            this.load.image(key, `/static/assets/${key}.png`);
        }
        this.load.spritesheet("lightning", "/static/assets/electronic.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("waterwave", "/static/assets/waterwave.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("explosion", "/static/assets/explosion.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("fireflame", "/static/assets/fireflame.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("holycross", "/static/assets/holycross.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("voidsheid", "/static/assets/voidsheild.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
        this.load.spritesheet("wind", "/static/assets/wind.png", {
            frameWidth: 64,
            frameHeight: 64,
        });
    }

    // !!) 매 scenc마다 player 객체가 새롭게 정의 (모든 스탯 초기화)
    // create() : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
    create() {
        this.anims.create({
            key: "lightning-burst",
            frames: this.anims.generateFrameNumbers("lightning", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 0
        });
        this.anims.create({
            key: "water-wave",
            frames: this.anims.generateFrameNumbers("waterwave", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });
        this.anims.create({
            key: "explosion-bomb",
            frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });
        this.anims.create({
            key: "fire-shot",
            frames: this.anims.generateFrameNumbers("fireflame", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });
        this.anims.create({
            key: "holy-cross",
            frames: this.anims.generateFrameNumbers("holycross", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });
        this.anims.create({
            key: "void-sheild",
            frames: this.anims.generateFrameNumbers("voidsheild", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });
        this.anims.create({
            key: "wind-blow",
            frames: this.anims.generateFrameNumbers("wind", { start: 0, end: 5 }),
            frameRate: 18,
            repeat: 1
        });


        // 맵 크기 설정 (물리적 공간 범위 설정)
        this.physics.world.setBounds(0, 0, CFG.world.width, CFG.world.height);

        // 카메라의 이동 범위 설정
        // 카메라의 범위는 게임의 비율과 줌 수준으로 결정
        this.cameras.main.setBounds(0, 0, CFG.world.width, CFG.world.height);

        const map = this.add.image(0, 0, "map").setOrigin(0);

        // 맵 이미지를 맵 크기에 맞춰 변경
        map.displayWidth = CFG.world.width;
        map.displayHeight = CFG.world.height;

        // Player(gameObject) 생성 및 rigid body 추가
        this.player = this.physics.add.sprite(400, 300, "player");
        this.player.setCollideWorldBounds(true);
        // 바라보는 방향 설정
        this.player.facing = new Phaser.Math.Vector2(0, -1);

        // 넉백 변수
        this.player.isKnockback = false;
        this.player.knockbackVel = new Phaser.Math.Vector2(0, 0);
        // 대쉬 설정
        this.player.dash = {
            active: false,
            dir: new Phaser.Math.Vector2(0, 0),
            start: 0,
            duration: CFG.dash.durationMs,
            v0: 0,
        };

        this.playerStats = new PlayerStats();

        // 카메라가 Player(gameObject)를 추적하도록 설정
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        this.monsters = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.items = this.physics.add.group();

        spawnMonsters(this);

        console.log(1)

        // 충돌 이벤트 정의
        this.physics.add.collider(this.monsters, this.monsters);
        this.physics.add.collider(
            this.player,
            this.monsters,
            this.onPlayerHitByMonster,
            null,
            this
        );
        // 겹침 이벤트 정의
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

        console.log(2)

        // 방향키에 대한 객체 생성
        this.cursors = this.input.keyboard.createCursorKeys();

        // 입력 가능한 키에 대한 객체 생성
        this.keys = this.input.keyboard.addKeys("Q,W,E,R");
        const pageUp = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.PAGE_UP
        );
        const pageDown = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN
        );

        console.log(3)

        // 각 키에 함수 연결
        pageUp.on("down", () => this.useItemShortcut(0));
        pageDown.on("down", () => this.useItemShortcut(1));
        // 모든 키의 입력이 이벤트 객체(e)로써 연결된 함수로 전달
        this.input.keyboard.on("keydown", (e) => this.handleArrowDoubleTap(e));

        // 시간 경과에 따른 함수 추가
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

        console.log(4)

        // 인벤토리 구현
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

        console.log(5)

        // 시스템 메세지 창
        this.textBar = "게임 시작!";

        // 이펙트 출력 함수 바인딩
        this.spawnShockwave = (x, y, radius, dmg) =>
            spawnShockwave(this, x, y, radius, dmg);
        this.spawnLightning = (x, y, radius, dmg) =>
            spawnLightning(this, x, y, radius, dmg);
        this.spawnHitFlash = (x, y) => spawnHitFlash(this, x, y);

        console.log(6)
    }

    /** skillSlots에 최대 4개의 스킬 이름을 추가 */
    setSkillSlots(slots) {
        this.skillSlots = (slots || []).slice(0, 4).map((s) => (s ? s.name : null));
    }

    /** itemSlots에 최대 2개의 아이템을 추가 */
    setItemSlots(itemSlots) {
        this.itemShortcutSlots = (itemSlots || [])
            .slice(0, 2)
            .map((i) => (i ? { id: i.id, name: i.name, icon: i.icon } : null));
    }

    /** skill upgrade */
    upgradeSkillByName(skillName) {
        const skill = this.skills[skillName];

        // skill이 존재하지 않거나, 아직 익히지 못한 스킬일 경우(lv: 0), 미동작
        if (!skill) return false;
        if (this.playerStats.skillPoints <= 0) return false;

        skill.levelUp();
        this.playerStats.skillPoints -= 1;

        // 시스템 메세지 출력
        this.textBar = `${skillName} 스킬 레벨업! (Lv${skill.level})`;
        console.log(skill.level)

        return true;
    }

    /** use skill */
    useSkill(slotIdx) {
        const name = this.skillSlots[slotIdx];

        // skill이 등록되지 않았거나(이름 미추가), 존재하지 않을 경우, 미동작
        if (!name) return;
        const skill = this.skills[name];
        if (!skill) return;

        skill.tryCast(this, this.player);
    }

    /** use item */
    useItemShortcut(idx) {
        const slot = this.itemShortcutSlots[idx];

        // slot이 빈 경우, 시스템 메세지 출력 및 미동작
        if (!slot) return (this.textBar = "단축키에 아이템 없음");

        // inventory에서 동일한 id를 가진 slot의 인덱스를 반환 (존재하지 않으면 -1 반환)
        const invIdx = this.inventory.items.findIndex((i) => i.id === slot.id);
        if (invIdx === -1) return (this.textBar = "인벤토리에 아이템이 없습니다");

        useItemFromInventory(this, invIdx);
    }

    // update() : 유니티의 update()와 동일 (프레임 단위 호출) - TODO
    update() {
        const now = this.time.now;

        // TODO: 넉백 확인 >> 피격 함수로 이전
        this.handlePlayerKnockback();
        // TODO: 시간에 따른 대쉬 감속/정지 >> coroutine으로 대쉬 함수에 편입 가능한지 확인
        this.handleDash(now);
        this.handleMovement();
        this.updateMonsters();
        // TODO: 몬스터 사망 및 아이템 드롭 >> 몬스터 피격 함수로 이전
        this.checkMonstersDeath();
        this.updateMonsterHud();

        // 프레임 단위로 키 입력 확인
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.useSkill(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.W)) this.useSkill(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSkill(2);
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.useSkill(3);

        if (this.count >= 12) {
            this.scene.start('TestScene');
        }
    }

    /** 플레이어 이동 처리 */
    handleMovement() {
        // 넉백, 대쉬 중에 입력 무시
        if (this.player.isKnockback || this.player.dash.active) return;

        // 프레임 단위로 속도 초기화
        this.player.setVelocity(0);

        // 방향키에 맞춰 속도 및 바라보는 방향 설정
        if (this.cursors.left.isDown) {
            if (this.current) {
                this.current = false;
                this.player.flipX = false;
            }
            this.player.setVelocityX(-CFG.moveSpeed);
            this.player.facing.set(-1, 0);
        }
        if (this.cursors.right.isDown) {
            if (!this.current) {
                this.current = true;
                this.player.flipX = true;
            }
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

    /** 대쉬 동작 */
    handleArrowDoubleTap(e) {
        const now = this.time.now;

        // 쿨타임이 아직 지나지 않았을 경우, 대쉬 미발동
        if (now - this.lastDashAt < CFG.dash.cooldownMs) return;

        // 입력 받은 키값이 방향키에 속하지 않을 경우, 대쉬 미발동
        const code = e.code;
        if (!this.lastArrowTap.hasOwnProperty(code)) return;

        // 연속으로 입력 받은 시간이 대쉬를 사용하기 위한 최소 시간 내라면, 대쉬 발동
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

    /** 대쉬 구현 */
    doDash(dir) {
        const D = CFG.dash.distance;
        const T = CFG.dash.durationMs;
        const v0 = (2 * D) / (T / 1000);

        this.player.dash.active = true;
        this.player.dash.dir = dir.clone().normalize();
        this.player.dash.start = this.time.now;
        this.player.dash.duration = T;
        this.player.dash.v0 = v0;

        // 대쉬 이펙트
        const c = CFG.dash.cameraFlash;
        this.cameras.main.flash(c.duration, c.r, c.g, c.b);
        this.textBar = "대쉬!";
    }

    /** 대쉬 지속 */
    handleDash(now) {
        const d = this.player.dash;
        if (!d.active) return;

        // 대시가 지속 중인 시간 확인
        const elapsed = now - d.start;
        if (elapsed >= d.duration) {
            d.active = false;
            this.player.setVelocity(0);
            return;
        }

        // 대시 진행률에 따라 속도 감속 및 정지
        const progress = Phaser.Math.Clamp(elapsed / d.duration, 0, 1);
        const speed = d.v0 * (1 - progress);
        this.player.setVelocity(d.dir.x * speed, d.dir.y * speed);
    }

    /** 데미지 출력 */
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

    /** 유저 넉백 구현 */
    handlePlayerKnockback() {
        if (!this.player.isKnockback) return;

        // 설정된 넉백 계수만큼 밀림
        this.player.setVelocity(
            this.player.knockbackVel.x,
            this.player.knockbackVel.y
        );

        // 넉백 계수 조절
        this.player.knockbackVel.scale(CFG.playerKB.decay);

        // 넉백 종료
        if (this.player.knockbackVel.length() < CFG.playerKB.stopSpeed) {
            this.player.isKnockback = false;
            this.player.setVelocity(0);
        }
    }

    /** 몬스터 피격 구현 */
    onBulletHit = (bullet, monster) => {
        if (!bullet || !bullet.active || !monster || !monster.active) return;

        // 중복 히트/재귀 방지를 위해 먼저 비활성화
        if (bullet.body) bullet.body.enable = false;

        // 몬스터 체력 감소 및 피격 이펙트 출력
        const dmg = bullet.damage || 10;
        monster.hp -= dmg;
        this.spawnHitFlash(monster.x, monster.y);

        // 데미지 출력
        // (크리티컬 판정 로직이 있는 경우에)
        // if (isCritical) {
        //   this.showDamageText(monster, damage, "#ffff66"); // 노란색
        // } else {
        //   this.showDamageText(monster, damage, "#ffffff");
        // }
        this.showDamageText(monster, dmg, "#ffffff");

        // 몬스터 어그로
        this.onMonsterAggro(monster);

        // Defensive Code of onHit function
        try {
            // 공격의 onHit 함수 실행
            if (typeof bullet.onHit === "function") bullet.onHit(monster);
        } catch (err) {
            // onHit 함수 실행 중 오류가 발생해도 게임 정지 대신 오류 메세지만 출력
            console.error("[onHit error]", err);
        }

        // 도트 데미지
        if (bullet.dot) this.applyDot(monster, bullet.dot);

        bullet.destroy();
    };

    /** 아이템 획득 */
    onPickupItem = (player, itemSprite) => {
        if (!itemSprite.pickDef) return;

        const def = itemSprite.pickDef;
        const exist = this.inventory.items.find((i) => i.id === def.id);

        if (exist) exist.count += def.count || 1;
        else this.inventory.items.push({ ...def }); // Spread Operator : 객체의 모든 속성을 새로운 객체에 복사

        itemSprite.destroy();

        this.textBar = `${def.name} 획득`;
    };

    /** 플레이어 피격 - TODO */
    onPlayerHitByMonster = (player, monster) => {
        if (!player || !monster) return;

        // TODO: 존재 이유 확인
        if (!player._lastHitAt) player._lastHitAt = 0; // ?? 0일 때 0으로 초기화를 진행

        const now = this.time.now;

        // 피격 무적 시간이 지나지 않았을 경우, 피격 무시
        if (now - player._lastHitAt < CFG.playerKB.invulMs) return;

        this.playerStats.hp -= monster.atk;

        // 피격 데미지 출력 (빨간색)
        this.showDamageText(player, monster.atk, "#ff3333");

        // 마지막으로 피격된 시간 저장
        player._lastHitAt = now;
        this.textBar = "Tlqkf"; // ??

        // 넉백 거리 정규화
        const dir = new Phaser.Math.Vector2(
            player.x - monster.x,
            player.y - monster.y
        ).normalize();
        player.isKnockback = true;
        player.knockbackVel.set(
            dir.x * CFG.playerKB.power,
            dir.y * CFG.playerKB.power
        );

        // 피격 효과 (카메라, 색상)
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

    /** 플레이어 부활 */
    onPlayerDeath() {
        this.textBar = "사망했습니다.";

        // 부활 대기 시간 이후, 부활
        this.time.delayedCall(800, () => {
            this.playerStats.hp = this.playerStats.maxHp;
            this.player.x = 400;
            this.player.y = 300;

            this.cameras.main.flash(200);
        });
    }

    /** 도트 데미지 스킬 적용 */
    applyDot(monster, dot) {
        // 틱 수 설정
        const ticks = Math.max(1, Math.floor(dot.duration / dot.interval));

        for (let i = 1; i <= ticks; i++) {
            // 설정한 interval에 따라 지연 동작
            this.time.delayedCall(dot.interval * i, () => {
                if (!monster || !monster.active) return;

                monster.hp -= dot.damage;
                this.spawnHitFlash(monster.x, monster.y);
                this.onMonsterAggro(monster);
            });
        }
    }

    /** 어그로 생성 */
    onMonsterAggro(monster) {
        monster.isAggro = true;
    }

    /** 몬스터 동작 */
    updateMonsters() {
        // 몬스터 그룹 순회
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

    /** 몬스터 체력바, 이름 출력 */
    updateMonsterHud() {
        // 몬스터 그룹 순회
        this.monsters.children.iterate((m) => {
            if (!m) return;

            const g = m.hpBar;
            if (!g) return;
            // 이전 프레임의 체력바를 지움
            g.clear();

            // 활동 중인 몬스터인 경우에만 아래 출력 - TODO: 몬스터 동작 함수 쪽으로 편입
            if (!m.active) return;

            // 체력바 출력
            const w = 56,
                h = 6;
            const x = m.x - w / 2,
                y = m.y - 34;
            g.fillStyle(0x000000, 0.6).fillRect(x, y, w, h);
            const pct = clamp01(m.hp / m.maxHp);
            g.fillStyle(0xff3333, 1).fillRect(x + 1, y + 1, (w - 2) * pct, h - 2);
            // 이름 출력
            if (m.label) m.label.setPosition(m.x - w / 2, y - 14);
        });
    }

    /** 몬스터 사망 */
    checkMonstersDeath() {
        this.monsters.children.iterate((m) => {
            if (!m || !m.active) return;
            if (m.hp > 0) return;

            this.playerStats.addExp(m.expReward);

            console.log(m, m.dropTable);

            // 드랍 테이블 확인
            (m.dropTable || []).forEach((drop) => {
                console.log('1')
                // 드랍 확률에 의거하여 아이템 드랍
                if (Phaser.Math.Between(0, 100) < drop.chance * 100) {
                    if (drop.id === "gold_coin") {
                        this.inventory.money += Phaser.Math.Between(5, 20);
                    } else {
                        const it = this.items.create(m.x, m.y, "item");
                        it.pickDef = resolveDropItem(drop);
                    }
                }
            });

            // 몬스터 사망 시, 색상 변경(이후 삭제) 및 출력 중인 체력바, 이름 삭제
            m.setTint(0x333333);
            if (m.hpBar) m.hpBar.clear();
            if (m.label) m.label.destroy();
            // 죽는 애니메이션 추가 및 해당 애니메이션 종료 시점에 drop 함수 호출이 가능한지 확인
            m.destroy();
            this.count += 1
            // this.time.delayedCall(400, () => {
            //     if (m && m.destroy) m.destroy();
            // });
        });
    }
}
