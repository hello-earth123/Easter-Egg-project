import Phaser from "phaser";
import { CFG } from "../../config/Config.js";
import { clamp01 } from "../../utils/MathUtils.js";
import { initPlayer } from "../../player/PlayerStats.js";
import { initSlot } from "../../manager/slotManager.js";
import { createDefaultSkills } from "../../skills/index.js";
import {
    spawnShockwave,
    spawnLightning,
    spawnHitFlash,
} from "../../effects/Effects.js";
import { initInventory, resolveDropItem, useItemFromInventory } from "../../items/Inventory.js";
import { spawnMonsters } from "../../entities/TestMonsterFactory.js";
import { FloatingText } from "../../effects/FloatingText.js";
import { preloadFireSkillAssets } from "../../preload/preloadFireSkills.js";
import { createFireSkillAnims } from "../../preload/createFireSkillAnims.js";
import { setCurrentScene } from "../../manager/sceneRegistry.js";
import SoundManager from "../../manager/SoundManager.js";
import { saveGame } from "../../manager/saveManager.js"; 
import { loadGame } from "../../manager/saveManager.js";
import { preloadMonsterAnims } from "../../preload/preloadMonsterAnims.js";
import { preloadGameSet } from "../../preload/preloadGameSet.js";
import { preloadSound } from "../../preload/preloadSound.js";
import { createPotalAnims } from "../../preload/createPotalAnims.js";
import { createPlayerAnims } from "../../preload/createPlayerAnims.js";
import { createMonsterAnims } from "../../preload/createMonsterAnims.js";

// 컷씬
import CutscenePlayer from "../../cutscene/CutscenePlayer.js";

// export default : 모듈로써 외부 접근을 허용하는 코드
// Scene : 화면 구성 및 논리 처리 요소
export default class DeeperMountain extends Phaser.Scene {

    init(data) {
        this.userId = data.userId;
        this.registry.set('userId', this.userId);
        
        let fromPortal = null;
        if (data){
            fromPortal = data.fromPortal;
        }

        const portalSpawnPoints = {
            // east: { x: 70, y: 600 },   // Scene의 east 포탈을 타면 여기서 등장
            south: { x: 800, y: 200 },
            // west: { x: 1530, y: 600 },
            north: { x: 800, y: 956},
        };

        if (fromPortal && portalSpawnPoints[fromPortal]) {
            this.spawnX = portalSpawnPoints[fromPortal].x;
            this.spawnY = portalSpawnPoints[fromPortal].y;
        } else {
            this.spawnX = 800;
            this.spawnY = 600;
        }
    }

    // constructor() : 클래스 생성자 함수로 Scene 객체 생성
    constructor() {
        super({ key: "DeeperMountain" });

        this.mapKey = "DeeperMountain";

        this.mapName = "깊어지는 산";   // 맵 이름

        this.textBar = "";
        this.lastArrowTap = {
            ArrowRight: 0,
            ArrowLeft: 0,
            ArrowUp: 0,
            ArrowDown: 0,
        };
        this.lastDashAt = 0;

        this.monsterData = {
            snake: 2,
            bat: 4,
            wolf: 5,
            // hidden: 15,
        };

        this.minLevel = 1;
        this.maxLevel = 1;

        this.count = 0;

        // 캐릭터 방향 true: right
        this.current = false;

        // load scene 없이 동작시키기 위함
        this.isPlayerLoad;
        this.playerStats;

        this.inventoryData;
        this.slotData;

        this.skills;

        this.itemShow = {
        hpPotion: 'HP 포션',
        mpPotion: 'MP 포션',
        damageGemLow: '하급 보석 (데미지)',
        damageGemMid: '중급 보석 (데미지)',
        damageGemHigh: '상급 보석 (데미지)',
        damageGemSuper: '특급 보석 (데미지)',
        cooldownGemLow: '하급 보석 (쿨타임)',
        cooldownGemMid: '중급 보석 (쿨타임)',
        cooldownGemHigh: '상급 보석 (쿨타임)',
        cooldownGemSuper: '특급 보석 (쿨타임)',
        manaCostGemLow: '하급 보석 (마나 소모)',
        manaCostGemMid: '중급 보석 (마나 소모)',
        manaCostGemHigh: '상급 보석 (마나 소모)',
        manaCostGemSuper: '특급 보석 (마나 소모)',
        defenseGemLow: '하급 보석 (방어력)',
        defenseGemMid: '중급 보석 (방어력)',
        defenseGemHigh: '상급 보석 (방어력)',
        defenseGemSuper: '특급 보석 (방어력)',
        luckGemLow: '하급 보석 (행운)',
        luckGemMid: '중급 보석 (행운)',
        luckGemHigh: '상급 보석 (행운)',
        luckGemSuper: '특급 보석 (행운)',
        }
    }

    // preload() : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
    preload() {
        this.load.image("deeper_mountain", "/static/assets/map/deeper_mountain.png");
        this.load.tilemapTiledJSON('deeper_mountainTile', '/static/assets/map/deeper_mountain.json');
        // BGM
        this.load.audio("bgm_deeper_mountain", "/static/assets/sound/background/bgm_deeper_mountain.wav");

        preloadFireSkillAssets(this);
        preloadMonsterAnims(this);
        preloadGameSet(this);
        preloadSound(this);
    }

    // !!) 매 scenc마다 player 객체가 새롭게 정의 (모든 스탯 초기화)
    // create() : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
    create() {
        setCurrentScene(this);
        if (this.game.vue?.setMapTitle) {
            this.game.vue.setMapTitle(this.mapName);
        }
        // 사운드 ===========================================
        this.SoundManager = SoundManager.getInstance();
        this.footstepCooldown = 0;
        this.FOOTSTEP_INTERVAL = 315; // 발소리 사운드 간격 (ms)
        this.isMoving = false;        // 이동 여부 flag
        this.showMapName = true;      // ← 맵 도착 시 한 번 표시해야 함
        // 1. 씬 BGM
        this.SoundManager.playBgm("bgm_deeper_mountain")

        createPotalAnims(this);
        createPlayerAnims(this);
        createMonsterAnims(this);

        // 스킬 애니메이션 매핑
        this.skillMotionType = {
            fireball: "small",
            firebomb: "small",
            napalm: "small",
            incendiary: "small",

            buff: "buff",

            meteor_S: "big",
            meteor_M: "big",
            meteor_L: "big",
            deathhand: "big",
            flameA: "big",
            flameB: "big",
            flameC: "big",
        };
        
        // ======================= UI =============================
        this.uiState = {
            inventory: false,   // 인벤토리 창
            skill: false,       // 스킬 창
            stat: false,        // 스탯 창
            menu: false,        // 메뉴 창
            sound: false,       // 사운드 창

        };


        // ===================== 맵 및 카메라 =======================
        // 맵 크기 설정 (물리적 공간 범위 설정)
        this.physics.world.setBounds(0, 0, CFG.world.width, CFG.world.height);

        // 카메라의 이동 범위 설정
        // 카메라의 범위는 게임의 비율과 줌 수준으로 결정
        this.cameras.main.setBounds(0, 0, CFG.world.width, CFG.world.height);

        const map = this.add.image(0, 0, "deeper_mountain").setOrigin(0);
        const tile = this.make.tilemap({key: 'deeper_mountainTile'});
        const collisionObjects = tile.getObjectLayer("collider");


        // 맵 이미지를 맵 크기에 맞춰 변경
        map.displayWidth = CFG.world.width;
        map.displayHeight = CFG.world.height;
        // ===================== 맵 및 카메라 =======================



        // ====================== 플레이어 ==========================
        // Player(gameObject) 생성 및 rigid body 추가
        this.player = this.physics.add.sprite(this.spawnX, this.spawnY, "playerSheet");
        this.player.setCollideWorldBounds(true);
        // 플레이어 크기 확대
        this.player.setScale(3);
        // 바라보는 방향 설정
        this.player.facing = new Phaser.Math.Vector2(0, -1);

        // 플레이어(hitbox) 보정
        const pw = this.player.width;   // scale=3 적용된 실제 픽셀 크기
        const ph = this.player.height;

        // 플레이어 hitbox 비율 (추천값)
        const PLAYER_HITBOX = {
            w: 0.55,   // 좌/우 폭 55%만 사용 (옆 판정 줄이기)
            h: 0.85    // 상/하 판정 거의 유지
        };

        const hitW = pw * PLAYER_HITBOX.w;
        const hitH = ph * PLAYER_HITBOX.h;

        // 직사각형 hitbox 적용
        this.player.body.setSize(hitW, hitH);

        // sprite 중앙 정렬 → 절대 어긋나지 않음
        this.player.body.setOffset(
            (pw - hitW) * 0.5,
            (ph - hitH) * 0.5
        );

        // 캐스팅 플래그 (홀딩 스킬 여부 판별 때문)
        this.player.isCasting = false;

        // 컷씬 때 움직이지 못하게 하기
        this.cutsceneLock = false;

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

        // 시간 경과에 따른 함수 추가  (플레이어 mp 자동 회복:  1초에 6씩 회복)
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (this.playerStats.mp < this.playerStats.maxMp) {
                    this.playerStats.mp = Math.min(
                        this.playerStats.maxMp,
                        this.playerStats.mp + 6
                    );
                }
            },
        });

        // 플레이어 데이터 불러오기 (스탯, 인벤토리, 슬롯)
        this.isPlayerLoad = false;
        initPlayer(this.userId).then(player => {
            this.playerStats = player;
        })
        initInventory(this.userId).then(inven => {
            this.inventoryData = inven;
        })
        initSlot(this.userId).then(slot => {
            this.slotData = slot;
            this.isPlayerLoad = true;
        })

        // 카메라가 Player(gameObject)를 추적하도록 설정 (카메라 시점 고정)
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

        this.monsters = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.items = this.physics.add.group();

        spawnMonsters(this);

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
        // 플레이어가 아이템과 충돌한 경우 (아이템을 먹은 경우)
        this.physics.add.overlap(
            this.player,
            this.items,
            this.onPickupItem,
            null,
            this
        );
        // 몬스터가 맞은 경우 (fireball의 경우) =========================== > 이 경우는 플레이어 아니고 몬스터임
        this.physics.add.overlap(
            this.bullets,
            this.monsters,
            this.onBulletHit,
            null,
            this
        );


        // 충돌 보정
        if (collisionObjects && collisionObjects.objects) {
            collisionObjects.objects.forEach(obj => {
                const x = obj.x + obj.width / 2;
                const y = obj.y + obj.height / 2; // Tiled y 기준 보정

                const collider = this.add.rectangle(x, y, obj.width, obj.height)
                    .setOrigin(0.5, 0.5);

                // Arcade Physics body 추가
                this.physics.add.existing(collider, true); // true = static body
                this.physics.add.collider(this.monsters, collider);
                this.physics.add.collider(this.player, collider);
                this.physics.add.collider(this.items, collider);
                this.physics.add.collider(this.bullets, collider);
            });
        }

        // 방향키에 대한 객체 생성
        this.cursors = this.input.keyboard.createCursorKeys();
        // =========================================================




        // ======================= 단축키 ===========================
        // 입력 가능한 키에 대한 객체 생성
        this.keys = this.input.keyboard.addKeys("Q,W,E,R");  
        const pageUp = this.input.keyboard.addKey(           
            Phaser.Input.Keyboard.KeyCodes.PAGE_UP
        );
        const pageDown = this.input.keyboard.addKey(        
            Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN
        );

        // 각 키에 함수 연결
        pageUp.on("down", () => this.useItemShortcut(0));
        pageDown.on("down", () => this.useItemShortcut(1));
        // 모든 키의 입력이 이벤트 객체(e)로써 연결된 함수로 전달
        this.input.keyboard.on("keydown", (e) => this.handleArrowDoubleTap(e));

        this.skills = createDefaultSkills(this);
        // ==========================================================




        // ================ 시스템 메세지 창 (로그창) ==================
        this.textBar = "게임 시작!";

        // 이펙트 출력 함수 바인딩
        this.spawnShockwave = (x, y, radius, dmg) =>
            spawnShockwave(this, x, y, radius, dmg);
        this.spawnLightning = (x, y, radius, dmg) =>
            spawnLightning(this, x, y, radius, dmg);
        this.spawnHitFlash = (x, y) => spawnHitFlash(this, x, y);

        console.log(6)
        createFireSkillAnims(this);

        this.count = 0;

        // === 포탈 생성(애니메이션) ===

        // 포탈 4개 생성
        this.portals = {
            // east:  this.physics.add.sprite(1530, 600, "portal"),
            // west:  this.physics.add.sprite(70, 600, "portal"),
            south: this.physics.add.sprite(800, 956, "portal"),
            north: this.physics.add.sprite(800, 100, "portal")
        };

        for (const key in this.portals) {
            const portal = this.portals[key];
            portal.portalId = key;
            portal.setImmovable(true);
            portal.setScale(1.0);
            portal.play("portal-anim");

            portal.setDepth(5000);

        }
        // ======================================================================



        // ==================== 포탈 상호작용 ==========================
        this.canInteract = false;
        this.currentPortal = null;

        // UI는 하나만 유지
        this.interactText = this.add.text(0, 0, "F 키를 눌러 이동", {
            fontSize: "22px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: { x: 8, y: 4 }
        })
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(9999);

        // 플레이어가 어떤 포탈이든 밟으면 감지
        for (const key in this.portals) {
            const portal = this.portals[key];

            this.physics.add.overlap(this.player, portal, () => {
                this.canInteract = true;
                this.currentPortal = portal;

                // 상호작용 UI 위치 업데이트
                this.interactText.setPosition(portal.x, portal.y - 60);
                this.interactText.setVisible(true);
            });
        }

        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        // ======================================================================



        // =================== 컷씬, 대화창 =======================================
        // Vue Dialogue UI 가져오기
        this.dialogueUI = this.game.vue.$refs.dialogue;

        // SPACE 입력 받을 때 Vue로 전달
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keySpace.on("down", () => {
            if (this.dialogueActive) {
                this.dialogueUI.skip();
            }
        });

        this.cutscene = new CutscenePlayer(this);
     
        // 게임 시작 자동 컷씬 스크립트
        const introScript = [
            // { cmd: "say", text: "…여긴 어디지?" },
            // { cmd: "say", text: "아… 맞다. 난 이제 막 시골에서 도시로 올라왔지." },
            // { cmd: "say", text: "이름은 이프리트. 마법사가 되고 싶었던 평범한 청년이다." },

            // { cmd: "say", text: "하지만 현실은… 생각보다 잔혹했다." },
            // { cmd: "say", text: "도시의 마법사들은 나를 비웃었고, 제대로 상대해 주지도 않았다." },
            // { cmd: "wait", time: 400 },

            // { cmd: "say", text: "“그따위 실력으로 마법사를 꿈꾼다고?” 라는 말은 하루에도 열 번 넘게 들었다." },
            // { cmd: "say", text: "…억울했다. 어떻게든 인정받고 싶었는데." },

            // { cmd: "say", text: "그러다… 우연히 뒷골목에서 한 잡상인을 만났다." },
            // { cmd: "say", text: "그는 기묘한 광택의 스태프를 팔고 있었다." },

            // { cmd: "say", text: "값도 터무니없이 쌌다. 아무도 사지 않았기 때문일까." },
            // { cmd: "say", text: "하지만 그 순간… 이상하게도 손이 멈추지 않았다." },

            // { cmd: "say", text: "그리고 나는 그 스태프를 손에 넣었다." },
            // { cmd: "wait", time: 500 },

            // { cmd: "say", text: "…" },
            // { cmd: "say", text: "…잠깐. 방금 스태프가… 울었나?" },

            // { cmd: "say", text: "???: '드디어… 드디어 나를 깨워주는군.'" },
            // { cmd: "say", text: "이프리트: \"!? 뭐, 뭐야!? 누… 누구야!?\"" },

            // { cmd: "say", text: "???: '나는 프라가라흐. 봉인된 지 천 년, 나를 깨운 자여…'" },
            // { cmd: "say", text: "프라가라흐: '내 봉인을 풀어준다면… 너에게 진정한 힘을 주겠다.'" },

            // { cmd: "say", text: "이프리트: \"진정한… 힘을?\"" },
            // { cmd: "wait", time: 400 },

            // { cmd: "say", text: "그 순간, 스태프가 희미하게 웃은 것 같았다." },
            // { cmd: "say", text: "프라가라흐: '자, 이프리트. 우리의 모험을 시작하자고.'" },

            // { cmd: "say", text: "이프리트: \"…그래. 어디까지 갈 수 있을지, 한번 해보자고!\"" },

            // { cmd: "wait", time: 300 },

            // { cmd: "say", text: "프라가라흐: '후후… 그래. 나를 완전히 해방시켜준다면…'" },
            // { cmd: "say", text: "프라가라흐: '이 세계도… 너도… 모든 것이 바뀔 것이다.'" },

            // { cmd: "end" }
        ];

        // 씬 로딩 0.5초 후 자동 실행
        this.time.delayedCall(500, () => {
            this.cutscene.play(introScript);
        });
    }
    // ===========================================================================



    // ======================= 스킬, 아이템 슬롯 (단축키) ===========================
    /** skillSlots에 최대 4개의 스킬 이름을 추가 */
    setSkillSlots(slots) {
        this.slotData.skillSlots = (slots || [])
            .slice(0, 4)
            .map((s) => (s ? s.name : null));
    }

    /** itemSlots에 최대 2개의 아이템을 추가 */
    setItemSlots(itemSlots) {
        this.slotData.itemSlots = (itemSlots || [])
            .slice(0, 2)
            .map((i) => (i ? i : null));
    }
    // ===========================================================================



    // ============================ 스킬 레벨업 ====================================
    upgradeSkillByName(skillName) {
        const skill = this.skills[skillName];

        // skill이 존재하지 않거나, 아직 익히지 못한 스킬일 경우(lv: 0), 미동작
        if (!skill) return false;
        if (this.playerStats.skillPoints <= 0) return false;

        skill.levelUp();
        this.playerStats.skillPoints -= 1;

        // 스킬 포인트 레벨업 버튼 사운드
        this.SoundManager.playStatIncrease();

        // 시스템 메세지 출력
        this.textBar = `${skillName} 스킬 레벨업! (Lv${skill.level})`;
        console.log(skill.level)

        return true;
    }
    // ===========================================================================



    // ============================= 스킬 사용 =====================================
    useSkill(slotIdx) {
        // 슬롯에 스킬 없으면 return
        const name = this.slotData.skillSlots[slotIdx];
        if (!name) return;

        // 스킬 없으면 return
        const skill = this.skills[name];
        if (!skill) return;

        // --- 시전 전 상태 백업 ---
        const prevMp = this.playerStats.mp;
        const prevLastCastAt = skill.lastCastAt;
        const prevActive = skill.active;

        //  실제 스킬 시전 시도 (쿨타임/마나/조건은 스킬 안에서 판단)
        skill.tryCast(this, this.player);

        // --- 진짜로 "시전이 된 건지" 판별 ---
        let castSuccess = false;

        // 1) MP가 줄었으면 → 확실히 시전 성공
        if (this.playerStats.mp < prevMp) {
            castSuccess = true;
        }
        // 2) lastCastAt이 바뀌었다면 → 쿨타임 갱신 = 시전 성공
        else if (skill.lastCastAt != null && skill.lastCastAt !== prevLastCastAt) {
            castSuccess = true;
        }
        // 3) hold 스킬(Incendiary 등)이라면 active 플래그로 판단
        else if (skill.isHoldSkill && !prevActive && skill.active) {
            castSuccess = true;
        }

        // ❌ 쿨타임, 마나부족, 기타 조건 실패 → 아무 모션도 내보내지 말고 종료
        if (!castSuccess) return;

        // 스킬 캐스팅 사운드 (스킬에 성공했을 경우에만 시전) -> (윗 줄(1080줄)에서 넘어왔다면 확실히 casting된 것으로 판단)
        this.SoundManager.playSkillCast(name);

        // 여기까지 왔으면 "실제로 스킬이 발동된 것"만 남음
        const motionType = this.skillMotionType[name];
        if (motionType) {
            this.playPlayerSkillMotion(motionType, skill.isHoldSkill === true);
        }

        // hold 스킬이면 이동 정지
        if (skill.isHoldSkill) {
            this.player.setVelocity(0, 0);
        }
    }


    // ============================= 아이템 사용 =====================================
    useItemShortcut(idx) {
        const slot = this.slotData.itemSlots[idx];

        console.log(slot)

        // slot이 빈 경우, 시스템 메세지 출력 및 미동작
        if (!slot) return (this.textBar = "단축키에 아이템 없음");

        // inventory에서 동일한 id를 가진 slot의 인덱스를 반환 (존재하지 않으면 -1 반환)
        const invIdx = this.inventoryData.inventory.items.findIndex((i) => i.name === slot.name);
        if (invIdx === -1) return (this.textBar = "인벤토리에 아이템이 없습니다");

        useItemFromInventory(this, invIdx);

        // 아이템 사용 사운드
        this.SoundManager.playItemUse();
    }
    // =============================================================================



    
    // update() : 유니티의 update()와 동일 (프레임 단위 호출)
    update(time, delta) {
        // 컷씬 중에는 모든 조작 차단 + 몬스터도 멈춤
        if (this.cutsceneLock) {

            // 플레이어 정지
            if (this.player?.body) {
                this.player.setVelocity(0, 0);
                this.player.body.setAcceleration(0, 0);
                this.player.body.moves = false;
                if (this.player.anims) this.player.anims.stop();
            }

            // 몬스터 정지
            this.updateMonsters(this.time.now);

            return;
        }

        // 컷씬 종료 → 이동 허용
        if (this.player?.body) this.player.body.moves = true;
        this.monsters.children.iterate(m => {
            if (m?.body) m.body.moves = true;
        });


        if (!this.playerStats) return;  // playerStats 로딩 전 update 차단
        if (this.player?.isDead) return;// 플레이어 죽으면 return
        
        const now = this.time.now;

        // 발소리 사운드 쿨타임
        this.footstepCooldown -= delta;

        this.handlePlayerKnockback();
        this.handleDash(now);
        this.handleMovement();
        this.updateMonsters(now);
        this.checkMonstersDeath();
        this.updateMonsterHud();

        // 이동 중일 때 일정 간격으로 발소리 재생
        if (this.isMoving && this.footstepCooldown <= 0) {
            this.SoundManager.playFootstep();
            this.footstepCooldown = this.FOOTSTEP_INTERVAL;
        }

        // 프레임 단위로 키 입력 확인
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.useSkill(0);
        if (Phaser.Input.Keyboard.JustDown(this.keys.W)) this.useSkill(1);
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.useSkill(2);
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.useSkill(3);

        //---------------------------------------------------------------
        // Hold(키다운) 스킬 처리 — incendiary 전용
        //---------------------------------------------------------------
        const slotKeys = ["Q", "W", "E", "R"];

        for (let i = 0; i < 4; i++) {
            const key = slotKeys[i];
            const phaserKey = this.keys[key];
            const skillName = this.slotData.skillSlots[i];
            if (!skillName) continue;

            const skill = this.skills[skillName];
            if (!skill) continue;

            // 이 스킬이 키다운 스킬인지 확인
            if (!skill.isHoldSkill) continue;

            // 키를 누르고 있는 동안 지속 발사
            if (phaserKey.isDown) {
                if (!skill.active) {
                    skill.tryCast(this, this.player);
                }
            }

            //  키에서 손 떼면 종료
            if (Phaser.Input.Keyboard.JustUp(phaserKey)) {
                if (skill.stop) skill.stop();

                //  hold 스킬 끝났으니 캐스팅 플래그 및 애니 정리
                this.player.isCasting = false;
                this.player.anims.stop();
                this.player.setFrame(0);
            }
        }


        // === 포탈 상호작용 체크 ===
        if (this.canInteract && this.currentPortal) {

            if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
                this.moveToNextScene(this.currentPortal.portalId);
            }

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.currentPortal.x, this.currentPortal.y
            );

            if (dist > 150) {
                this.canInteract = false;
                this.currentPortal = null;
                this.interactText.setVisible(false);
            }
        }

        if (this.game.vue?.updateMiniMap) {
            const monsters = [];
            this.monsters.children.iterate(m => {
                if (m && m.active) monsters.push({ x: m.x, y: m.y });
            });

            const portals = [];
            if (this.portals) {
                Object.values(this.portals).forEach(p => {
                if (p) portals.push({ x: p.x, y: p.y });
                });
            }

            this.game.vue.updateMiniMap({
                mapName: this.mapName,
                player: { x: this.player.x, y: this.player.y },
                monsters,
                portals
            });
        }

    }

    // 플레이어 이동 벡터 관리 
    handleMovement() {
        if (this.activeHoldSkill) {
            this.player.setVelocity(0, 0);
            return;
        }

        if (this.player.isKnockback || this.player.dash.active) return;

        this.player.setVelocity(0);

        let moving = false;

        // 좌
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-CFG.moveSpeed);
            this.player.flipX = true;
            this.player.facing.set(-1, 0);
            moving = true;
        }

        // 우
        if (this.cursors.right.isDown) {
            this.player.setVelocityX(CFG.moveSpeed);
            this.player.flipX = false;
            this.player.facing.set(1, 0);
            moving = true;
        }

        // 하
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-CFG.moveSpeed);
            this.player.facing.set(0, -1);
            moving = true;
        }

        // 상
        if (this.cursors.down.isDown) {
            this.player.setVelocityY(CFG.moveSpeed);
            this.player.facing.set(0, 1);
            moving = true;
        }

        // 이동 여부 플래그 갱신
        this.isMoving = moving;

        if (moving) {
            // 스킬 캐스팅 중이면 walk 애니로 덮어쓰지 않음
            if (!this.player.isCasting) {
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "player_walk") {
                    this.player.play("player_walk", true);
                }
            }
        } else {
            // 스킬 캐스팅 중이면 애니 stop 하지 않음
            if (!this.player.isCasting) {
                this.player.anims.stop();
                this.player.setFrame(0);  // 기본 프레임 유지
                
            }
            // 멈춘 순간 쿨타임 리셋 → 다시 움직이면 바로 발소리 나게
            this.footstepCooldown = 0;
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
        // 🔥 대쉬 사운드
        this.SoundManager.playDash();

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

    /** 데미지 출력 (영수증) */
    showDamageText(target, damage, color = "#ffff66") {
        if (!target || !target.x || !target.y) return;

        const rounded = Math.round(damage);

        const txt = new FloatingText(
            this,
            target.x,
            target.y - 20,
            `-${rounded}`,
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

    /** 몬스터 피격 구현 (fireball bullet) */
    onBulletHit = (bullet, monster) => {
        if (!bullet || !bullet.active || !monster || !monster.active) return;

        // 중복 히트/재귀 방지를 위해 먼저 비활성화
        if (bullet.body) bullet.body.enable = false;

        // 몬스터 체력 감소 및 피격 이펙트 출력
        const dmg = bullet.damage || 10;
        monster.hp -= dmg;
        this.spawnHitFlash(monster.x, monster.y);

        // 영수증 출력
        this.showDamageText(monster, dmg, "#ffff66");
        
        // 몬스터 피격 sound
        this.SoundManager.playMonsterHit();

        // 몬스터 어그로
        this.onMonsterAggro(monster);

        bullet.destroy();
    };

    /** 아이템 획득 */
    onPickupItem = (player, itemSprite) => {
        if (!itemSprite.getData('pickDef')) return;

        const def = itemSprite.getData('pickDef');
        const exist = this.inventoryData.inventory.items.find((i) => i.name === def.name);

        if (exist) exist.count += def.count || 1;
        else this.inventoryData.inventory.items.push({ ...def }); // Spread Operator : 객체의 모든 속성을 새로운 객체에 복사

        itemSprite.destroy();
        // 아이템 획득 사운드
        this.SoundManager.playItemPickup();
        this.textBar = `${this.itemShow[def.name]} 획득`;
    };

    /* 플레이어 피격 */
    onPlayerHitByMonster = (player, monster) => {
        if (!player || !monster) return;

        // 🔥 키다운 스킬(incendiary) 사용 중이면 즉시 끊기
        if (this.activeHoldSkill) {
            const s = this.skills[this.activeHoldSkill];
            if (s && s.stop) s.stop();
            this.activeHoldSkill = null;
        }
        
        if (!player._lastHitAt) player._lastHitAt = 0; // ?? 0일 때 0으로 초기화를 진행

        const now = this.time.now;

        // 피격 무적 시간이 지나지 않았을 경우, 피격 무시
        if (now - player._lastHitAt < CFG.playerKB.invulMs) return;

        const dmg = monster.atk - (monster.atk * (this.playerStats.defense + this.playerStats.defenseGem) / 100);
        this.playerStats.hp -= dmg

        // 플레이어 피격 sound
        this.SoundManager.playMonsterAttack();

        // 피격 데미지 출력 (빨간색)
        this.showDamageText(player, dmg, "#ff3333");
        this.player.play("player_hit", true);
        
        // 마지막으로 피격된 시간 저장
        player._lastHitAt = now;

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

        // 사망 체크
        if (this.playerStats.hp <= 0) {

            //  1) 플레이어 physics 충돌 완전 비활성화
            player.body.enable = false;

            //  2) 반동을 전혀 주지 않도록 속도 제거
            player.setVelocity(0, 0);

            // 몬스터들이 플레이어에 의해 밀리지 않도록 충돌 반응 차단
            this.monsters.children.iterate(m => {
                if (!m || !m.body) return;

                m.setVelocity(0, 0);   // 즉시 멈춤
                m.body.immovable = true;  // 반발력 제거
            });

            //  4) 사망 루틴 실행
            this.onPlayerDeath();
            return;
        }
        
        // === Incendiary(hold 스킬) 강제 중지 이벤트 ===
        this.events.emit("playerHit", {
            x: monster.x,
            y: monster.y,
            knockback: CFG.playerKB.power
        });
    };

    /** 플레이어 부활 **/
    /** 플레이어 사망 → GAME OVER 연출 → 마지막 저장 지점에서 리스폰 **/
    onPlayerDeath() {
        // 중복 호출 방지
        if (this.player.isDead) return;
        this.player.isDead = true;

        // HP를 정확히 0으로 고정 (음수 그대로 남는 문제 방지)
        if (this.playerStats) {
            this.playerStats.hp = 0;
        }

        // 텍스트 로그
        this.textBar = "사망했습니다.";

        // 플레이어 조작/충돌 차단
        this.player.setVelocity(0, 0);
        if (this.player.body) {
            this.player.body.enable = false;
        }

        // 🔊 사운드 매니저
        const sm = this.SoundManager || SoundManager.getInstance();

        /* ------------------------------
            1) BGM 일시정지 + 사망 SFX
        ------------------------------ */
        if (sm) {
            sm.pauseBgm();          // 배경음 멈춤
            if (sm.playDeath) {
                sm.playDeath();     // 사망 효과음 (player_death)
            }
        }

        /* ------------------------------
            2) GAME OVER 이미지 페이드인
        ------------------------------ */
        const cam = this.cameras.main;
        const centerX = cam.width / 2;
        const centerY = cam.height / 2;

        if (!this.gameOverImage) {
            // gameover는 image 타입
            this.gameOverImage = this.add.image(centerX, centerY, "gameover");
            this.gameOverImage.setDepth(9999);
            this.gameOverImage.setScrollFactor(0); // 카메라 고정
        } else {
            this.gameOverImage.setPosition(centerX, centerY);
            this.gameOverImage.setVisible(true);
        }

        // 🔥 화면 전체를 덮도록 크기 강제 설정
        this.gameOverImage.setDisplaySize(cam.width, cam.height);

        // 처음엔 투명
        this.gameOverImage.setAlpha(0);

        // 0.5초 동안 천천히 페이드인
        this.tweens.add({
            targets: this.gameOverImage,
            alpha: 1,
            duration: 5000,
            ease: "Quad.Out"
        });


        /* ------------------------------
            3) 슬로우 모션 사망 애니메이션
        ------------------------------ */
        const deathAnim = this.player.play("player_death");
        if (deathAnim) {
            deathAnim.timeScale = 0.4;   // 애니 속도 0.4배
        }

        /* ------------------------------
        🧊 몬스터 어그로 초기화
        ------------------------------ */
        if (this.monsters) {
        this.monsters.children.iterate(mon => {
            if (!mon) return;

            // 가장 흔한 방식: 타겟 초기화
            mon.target = null;

            // 추적/공격 상태를 초기화
            if (mon.state) mon.state = "idle";

            // 이동 정지
            if (mon.body) {
            mon.setVelocity(0, 0);
            }

            // 어그로 플래그 방식일 때
            if (mon.isAggro !== undefined) mon.isAggro = false;
        });
        }

        // 사망 애니가 끝났을 때
        this.player.once("animationcomplete-player_death", () => {

            // GAME OVER 화면이 켜진 상태로 0.4초 유지
            this.time.delayedCall(4000, () => {
                // 🔥 마지막 저장 지점에서 부활 처리
                this.respawnFromLastSave();
            });
        });
    }

    /** 마지막 저장 지점 로드 후 부활 처리 */
    async respawnFromLastSave() {
        const sm = this.SoundManager || SoundManager.getInstance();

        try {
            // 1) 백엔드에서 저장 데이터 가져오기
            const saveData = await loadGame();
            console.log("[respawnFromLastSave] loaded:", saveData);

            if (!saveData || !saveData.stats) {
                throw new Error("저장 데이터가 없습니다.");
            }

            const { stats, inventory, slots, scene } = saveData;

            /* ------------------------------
                A. 씬이 다른 경우 → 그 씬으로 전환
            (예: 저장한 장소가 TestScene3 이면 그쪽으로 이동)
            ------------------------------ */
            if (scene && scene !== this.scene.key) {
                // 다른 씬이 saveData를 처리하도록 넘겨줌
                this.scene.start(scene, { loadedSave: saveData });
                return;
            }

            /* ------------------------------
                B. 같은 씬이면 현재 씬 상태에 그대로 적용
            ------------------------------ */

            // 1) 스탯 복원
            this.playerStats = {
                ...this.playerStats,
                ...stats,
            };

            // HP가 0 이하로 저장돼 있었다면 최소 30%로 보정해서 부활시키기
            if (this.playerStats.hp <= 0) {
                this.playerStats.hp = Math.max(
                    1,
                    Math.floor(this.playerStats.maxHp * 0.3)
                );
            }

            // 2) 인벤토리 복원
            if (inventory) {
                this.inventoryData = {
                    ...this.inventoryData,
                    ...inventory,
                };
            }

            // 3) 슬롯(QWER / 아이템) 복원
            if (slots) {
                this.slotData = {
                    ...this.slotData,
                    ...slots,
                };

                if (this.setSkillSlots && slots.skillSlots) {
                    this.setSkillSlots(slots.skillSlots);
                }
                if (this.setItemSlots && slots.itemSlots) {
                    this.setItemSlots(slots.itemSlots);
                }
            }

            // 4) 위치 복원 (저장 데이터에 좌표가 있으면 사용, 없으면 기본 스폰으로)
            if (
                stats &&
                typeof stats.x === "number" &&
                typeof stats.y === "number"
            ) {
                this.player.x = stats.x;
                this.player.y = stats.y;
            } else {
                // TestScene2에서 이미 쓰고 있는 기본 스폰 좌표
                this.player.x = this.spawnX;
                this.player.y = this.spawnY;
            }

            // 5) 플레이어 상태 복구
            this.player.setFrame(0);
            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.isDead = false;

            // 카메라 플래시 연출
            this.cameras.main.flash(300);

            this.textBar = "마지막 저장 지점에서 부활했습니다!";
        } catch (e) {
            console.error("[respawnFromLastSave] 로드 실패:", e);
            // ⚠️ 실패 시에는 최소한 현재 씬에서라도 안전하게 부활
            if (this.playerStats) {
                this.playerStats.hp = Math.max(
                    1,
                    Math.floor(this.playerStats.maxHp * 0.3)
                );
            }
            this.player.x = this.spawnX;
            this.player.y = this.spawnY;
            this.player.setFrame(0);
            if (this.player.body) {
                this.player.body.enable = true;
            }
            this.player.isDead = false;
            this.cameras.main.flash(300);
            this.textBar = "부활했습니다!";
        } finally {
            // GAME OVER 이미지 페이드아웃
            if (this.gameOverImage) {
                this.tweens.add({
                    targets: this.gameOverImage,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.gameOverImage.setVisible(false);
                    },
                });
            }

            // BGM 재개
            if (sm) {
                sm.resumeBgm();
            }
        }
    }



    // ============================= 몬스터 어그로, 배회, 피격 등등 ===============================
    /** 어그로 생성 */
    onMonsterAggro(monster) {
        monster.isAggro = true;
    }

    /** 몬스터 동작 */
    updateMonsters(now) {
        // 컷씬/대화 중이면 모든 몬스터 정지
        if (this.cutsceneLock) {
            this.monsters.children.iterate((m) => {
                if (!m || !m.active || !m.body) return;

                // 이동 관련 모든 물리 속성 초기화
                m.body.setVelocity(0, 0);
                m.body.setAcceleration(0, 0);
                m.body.setDrag(1000, 1000);   // 급정지 효과
                m.body.moves = false;         // 이동 자체 비활성화
            });
            return;
        }

        // 몬스터 그룹 순회
        this.monsters.children.iterate((m) => {
            if (!m || !m.active) return;

            // 1) 넉백 중이면 넉백 우선
            if (m.isKnockback) {
                m.setVelocity(m.knockbackVel.x, m.knockbackVel.y);
                m.knockbackVel.scale(CFG.monsterKB.decay);
                if (m.knockbackVel.length() < CFG.monsterKB.stopSpeed) {
                    m.isKnockback = false;
                    m.setVelocity(0);
                }
                return;
            }

            // 2) 어그로 상태면 플레이어 추격 (기존 로직 유지)
            if (m.isAggro) {
                this.physics.moveToObject(m, this.player, 95);

                // 🔥 추격 방향에 따라 좌우 반전
                const vx = m.body?.velocity?.x ?? 0;
                if (vx < 0) m.flipX = false;
                else if (vx > 0) m.flipX = true;

                return;
            }

            // 3) 그 외에는 “짧게 왔다갔다” 배회
            this.updateMonsterWander(m, now);
        });
    }

    /** 배회 타겟 좌표 새로 지정 */
    pickNewWanderTarget(monster) {
        const originX = monster.wanderOriginX ?? monster.x;
        const originY = monster.wanderOriginY ?? monster.y;
        const range = monster.wanderRange || Phaser.Math.Between(32, 96);

        // “한 칸 ~ 세 칸” 정도 거리
        const dist = Phaser.Math.Between(range / 3, range);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

        let targetX = originX + Math.cos(angle) * dist;
        let targetY = originY + Math.sin(angle) * dist;

        // 월드 밖으로 안 나가게 클램프
        targetX = Phaser.Math.Clamp(targetX, 32, CFG.world.width - 32);
        targetY = Phaser.Math.Clamp(targetY, 32, CFG.world.height - 32);

        monster.wanderTargetX = targetX;
        monster.wanderTargetY = targetY;
    }

    /** 몬스터 배회(wander) AI */
    updateMonsterWander(monster, now) {
        if (!monster) return;

        // 🔥 몬스터별 walk 애니메이션 선택
        const animKey = this.monsterWalkAnim[monster.name];
        if (animKey) {
            if (!monster.anims.isPlaying || monster.anims.currentAnim.key !== animKey) {
                monster.play(animKey, true);
            }
        }

        // 타겟 없으면 찍기
        if (monster.wanderTargetX == null || monster.wanderTargetY == null) {
            this.pickNewWanderTarget(monster);
        }

        // 도착 후 잠깐 쉬기
        if (monster.wanderPauseUntil && now < monster.wanderPauseUntil) {
            monster.setVelocity(0);
            return;
        }

        const dx = monster.wanderTargetX - monster.x;
        const dy = monster.wanderTargetY - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) {
            monster.setVelocity(0);
            monster.wanderPauseUntil = now + Phaser.Math.Between(500, 1500);
            this.pickNewWanderTarget(monster);
            return;
        }

        // 속도 상향 (테스트용)
        const speed = monster.wanderSpeed || 80;  
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        monster.setVelocity(vx, vy);

        // 확실한 sprite flip 처리
        if (vx < -0.1) monster.flipX = false;
        else if (vx > 0.1) monster.flipX = true;
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

            // 활동 중인 몬스터인 경우에만 아래 출력
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
            
            // 몬스터 사망 사운드
            this.SoundManager.playMonsterDeath();
            // 플레이어 이전 레벨
            const prevLevel = this.playerStats.level;

            this.playerStats.addExp(m.expReward);
            
            if (this.playerStats.level > prevLevel) {
                this.SoundManager.playLevelUp();
            }

            // 드랍 테이블 확인
            (m.dropTable || []).forEach((drop) => {
                // 드랍 확률에 의거하여 아이템 드랍
                if (Phaser.Math.Between(0, 100) < drop.chance * 100) {
                    const it = this.items.create(m.x + Phaser.Math.Between(-30, 30), m.y + Phaser.Math.Between(-30, 30), drop.name);

                    resolveDropItem(drop).then(def => {
                        it.setData('pickDef', def);
                        it.setTexture(def.name)
                        // 아이템 드랍 사운드
                        this.SoundManager.playItemDrop();
                        console.log(it.getData('pickDef'))
                    })

                }
            });

            // 몬스터 사망 시, 색상 변경(이후 삭제) 및 출력 중인 체력바, 이름 삭제
            m.setTint(0x333333);
            if (m.hpBar) m.hpBar.clear();
            if (m.label) m.label.destroy();
            // 죽는 애니메이션 추가 및 해당 애니메이션 종료 시점에 drop 함수 호출이 가능한지 확인
            m.destroy();
            this.count += 1
        });
    }
    // ===========================================================================




    // 스킬 시전 시 애니메이션 실행
    playPlayerSkillMotion(type, isHold = false) {
        if (!this.player || !this.player.anims) return;

        // 이동 중지
        this.player.setVelocity(0, 0);

        let animKey = null;

        switch(type) {
            case "small": // fireball, firebomb, napalm, incendiary start
                animKey = "player_cast_small";
                break;

            case "buff": // buff skill
                animKey = "player_buff";
                break;

            case "big": // meteor S/M/L, deathhand, flameA/B/C
                animKey = "player_cast_big";
                break;

            case "incendiary-hold":
                animKey = "player_incendiary_loop";
                break;
        }

        if (!animKey) return;

        // 🔥 캐스팅 상태 ON
        this.player.isCasting = true;

        const anim = this.player.play(animKey, true);

        // 🔥 hold 스킬(incendiary 등) 말고, 일반 스킬은 애니 끝나면 캐스팅 해제
        if (!isHold && type !== "incendiary-hold") {
            this.player.once(`animationcomplete-${animKey}`, () => {
                this.player.isCasting = false;
            });
        }
    }



    // ========================= 스킬 피격 방식 메커니즘 ==========================
    /** 도트 데미지 스킬 적용 */
    applyDot(monster, dot) {
        // 틱 수 설정
        const ticks = Math.max(1, Math.floor(dot.duration / dot.interval));

        for (let i = 1; i <= ticks; i++) {
            // 설정한 interval에 따라 지연 동작
            this.time.delayedCall(dot.interval * i, () => {
                if (!monster || !monster.active) return;

                monster.hp -= dot.damage;
                this.showDamageText(monster, dot.damage, "#ffff66");
                this.spawnHitFlash(monster.x, monster.y);
                this.onMonsterAggro(monster);
            });
        }
    }

    /**
     * 즉발 원형 광역 데미지
     * FireBomb, Meteor, Deathhand 등이 사용
     */
    damageArea({ x, y, radius, dmg, collectTargets = false, onHit }) {
        if (!this.monsters) return [];

        const hitList = [];

        this.monsters.children.iterate((monster) => {
            if (!monster || !monster.active) return;

            const dx = monster.x - x;
            const dy = monster.y - y;
            if (dx * dx + dy * dy > radius * radius) return;

            // 즉발 피해
            monster.hp -= dmg;
            this.showDamageText(monster, dmg, "#ffff66");
            if (this.spawnHitFlash) this.spawnHitFlash(monster.x, monster.y);
            if (typeof this.onMonsterAggro === "function") {
                this.onMonsterAggro(monster);
            }

            if (collectTargets) hitList.push(monster);
        });

        if (hitList.length > 0 && typeof onHit === "function") {
            onHit();
        }

        return hitList;
    }


    /**
     * 한 번에 장판 안의 몬스터들에게 DoT(지속 피해) 부여
     * FlameA / FlameB / FlameC 에서 사용
     */
    applyDotArea({ x, y, radius, tickDmg, duration, interval = 400 }) {
        if (!this.monsters) return;

        const dot = {
            duration,
            interval,
            damage: tickDmg,
        };

        this.monsters.children.iterate((monster) => {
            if (!monster || !monster.active) return;

            const dx = monster.x - x;
            const dy = monster.y - y;
            if (dx * dx + dy * dy > radius * radius) return;

            this.applyDot(monster, dot);
        });
    }

    /**
     * 라인 형태의 지속 장판 DoT (Napalm 등에 사용)
     * origin(x, y)에서 dir 방향으로 length 만큼 뻗은 띠 모양 영역
     */
    applyPersistentDot({
        x,
        y,
        dir,
        length,
        radius,
        tickDmg,
        duration,
        interval,
    }) {
        if (!this.monsters) return;

        const nx = dir?.x ?? 1;
        const ny = dir?.y ?? 0;
        const totalTicks = Math.max(1, Math.floor(duration / interval));

        for (let i = 0; i < totalTicks; i++) {
            this.time.delayedCall(interval * i, () => {
                this.monsters.children.iterate((monster) => {
                    if (!monster || !monster.active) return;

                    const vx = monster.x - x;
                    const vy = monster.y - y;

                    // 라인상의 투영 길이 t
                    const t = vx * nx + vy * ny;
                    if (t < 0 || t > length) return;

                    // 라인으로부터의 수직 거리 체크
                    const px = nx * t;
                    const py = ny * t;
                    const lx = vx - px;
                    const ly = vy - py;
                    if (lx * lx + ly * ly > radius * radius) return;

                    monster.hp -= tickDmg;
                    this.showDamageText(monster, tickDmg, "#ffff66");
                    if (this.spawnHitFlash) {
                        this.spawnHitFlash(monster.x, monster.y);
                    }
                    if (typeof this.onMonsterAggro === "function") {
                        this.onMonsterAggro(monster);
                    }
                });
            });
        }
    }

    /**
     * 🔥 방향 직사각형 데미지 (Incendiary 전용)
     * originX, originY = 시작점
     * dir = 방향벡터
     * width = 스프라이트 폭(px)
     * height = 스프라이트 높이(px)
     * length = 전방 거리(px)
     */
    damageRectangle({ originX, originY, dir, width, height, length, dmg, onHit }) {
        if (!this.monsters) return;

        const nx = dir.x;
        const ny = dir.y;

        let hitSomething = false;

        this.monsters.children.iterate((monster) => {
            if (!monster || !monster.active) return;

            const vx = monster.x - originX;
            const vy = monster.y - originY;

            const t = vx * nx + vy * ny;
            if (t < 0 || t > length) return;

            const px = nx * t;
            const py = ny * t;
            const lx = vx - px;
            const ly = vy - py;

            const halfW = width * 0.5;
            if ((lx * lx + ly * ly) > (halfW * halfW)) return;

            this.showDamageText(monster, dmg, "#ffff66");
            // 🔥 데미지 적용
            monster.hp -= dmg;
            if (this.spawnHitFlash) this.spawnHitFlash(monster.x, monster.y);
            this.onMonsterAggro(monster);

            hitSomething = true;
        });

        // 🔥 명중했으면 onHit() 실행 (카메라 흔들림, 스킬 중단 등)
        if (hitSomething && typeof onHit === "function") {
            onHit();
        }
    }


    /** F 키로 다음 Scene 이동 (데이터 유지됨) */
    moveToNextScene(portalId) {
        this.SoundManager.playPortal();

        // ⭐ 포탈 → 목적지 씬 매핑 테이블
        const portalToScene = {
            south: "MountainEntrance",
            north: "SpookyMountain"
        };

        const nextScene = portalToScene[portalId];
        if (!nextScene) {
            console.warn("Unknown portalId:", portalId);
            return;
        }

        // 필요 시 해당 씬을 미리 add() (존재하지 않을 경우)
        if (!this.scene.get(nextScene)) {
            this.scene.add(nextScene, window[nextScene]); 
            // 🔥 주의: TestScene2, TestScene3 같은 씬들은 전역에 등록되어 있어야 함
        }

        const p = this.currentPortal;

        this.cameras.main.fadeOut(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            this.scene.start(nextScene, {
                playerStats: this.playerStats,
                inventoryData: this.inventoryData,
                slotData: this.slotData,
                fromPortal: portalId,
                spawnX: p.x,
                spawnY: p.y + 60
            });
        });
    }

    // 저장중...
    collectPlayerData() {
        return {
            stats: this.playerStats,
            inventory: this.inventoryData,
            slots: this.slotData,
            scene: this.scene.key
        };
    }

    // 게임 저장 완료
    saveGame() {
        const data = this.collectPlayerData();

        fetch("/api/save_game/1/", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(() => {
            console.log("게임 저장 완료!");
            this.textBar = "게임이 저장되었습니다!";
        })
        .catch(err => console.error(err));
    }

}


