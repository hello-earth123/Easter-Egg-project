import Phaser from "phaser";
import { CFG } from "../config/Config.js";
import { clamp01 } from "../utils/MathUtils.js";
import { initPlayer } from "../player/PlayerStats.js";
import { initSlot } from "../manager/slotManager.js";
import { createDefaultSkills } from "../skills/index.js";
import {
    spawnShockwave,
    spawnLightning,
    spawnHitFlash,
} from "../effects/Effects.js";
import { initInventory, resolveDropItem, useItemFromInventory } from "../items/Inventory.js";
import { spawnMonsters } from "../entities/TestMonsterFactory.js";
import { FloatingText } from "../effects/FloatingText.js";
import { preloadFireSkillAssets } from "../preload/preloadFireSkills.js";
import { createFireSkillAnims } from "../preload/createFireSkillAnims.js";
import TestScene3 from "./TestScene3.js";
import { setCurrentScene } from "../manager/sceneRegistry.js";
import SoundManager from "../manager/SoundManager.js";

// export default : 모듈로써 외부 접근을 허용하는 코드
// Scene : 화면 구성 및 논리 처리 요소
export default class TestScene2 extends Phaser.Scene {

    init(data) {
        let fromPortal = null;
        if (data){
            fromPortal = data.fromPortal;
        }
        // this.playerStats = data.playerStats;
        // this.inventoryData = data.inventoryData;
        // this.slotData = data.slotData;

        const portalSpawnPoints = {
            east: { x: 200, y: 600 },   // TestScene2의 east 포탈을 타면 여기서 등장
            south: { x: 700, y: 1000 },
            west: { x: 1400, y: 600 },
            north: { x: 700, y: 200},
        };

        if (fromPortal && portalSpawnPoints[fromPortal]) {
            this.spawnX = portalSpawnPoints[fromPortal].x;
            this.spawnY = portalSpawnPoints[fromPortal].y;
        } else {
            this.spawnX = 400;
            this.spawnY = 300;
        }
    }

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
            bat: 10,
            // rabbit: 3,
            hidden: 15,
            lich: 5,
            skull_b: 3,
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

        this.itemList = ['hpPotion', 'mpPotion', 'lowGem', 'midGem', 'highGem', 'superGem'];
        this.skills;
    }

    // TODO: preload, create의 중첩되는 요소에 대한 singleton 처리
    // preload() : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
    preload() {
        this.load.image("map2", "/static/assets/test.png");
        this.load.tilemapTiledJSON('map2Tile', '/static/assets/test.json');
        // 포탈 PNG 로드
        this.load.spritesheet("portal", "/static/assets/portal.png", {
            frameWidth: 102.1428,   // 포탈 프레임 최대 가로(당신이 원하는 값으로 맞추기)
            frameHeight: 120,  // 프레임 높이(실제 png 높이에 맞추기)
        });
        // 플레이어 PNG 로드
        this.load.spritesheet("playerSheet", "/static/assets/player.png", {
            frameWidth: 36,
            frameHeight: 24,
        });
        // 몬스터 PNG 로드
        // arrow_skeleton
        this.load.spritesheet("arrow_skeleton", "/static/assets/monsters/arrow_skeleton.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // bat
        this.load.spritesheet("bat", "/static/assets/monsters/bat.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // bird
        this.load.spritesheet("bird", "/static/assets/monsters/bird.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // butterfly
        this.load.spritesheet("butterfly", "/static/assets/monsters/butterfly.png", {
            frameWidth: 16,
            frameHeight: 16,
        // coffin
        });
        this.load.spritesheet("coffin", "/static/assets/monsters/coffin.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // dwarf
        this.load.spritesheet("dwarf", "/static/assets/monsters/dwarf.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // eyeball
        this.load.spritesheet("eyeball", "/static/assets/monsters/eyeball.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // eyebat
        this.load.spritesheet("eyebat", "/static/assets/monsters/eyebat.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // fire_skull1
        this.load.spritesheet("fire_skull1", "/static/assets/monsters/fire_skull1.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // fire_skull2
        this.load.spritesheet("fire_skull2", "/static/assets/monsters/fire_skull2.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // ghost
        this.load.spritesheet("ghost", "/static/assets/monsters/ghost.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // lich
        this.load.spritesheet("lich", "/static/assets/monsters/lich.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // mask
        this.load.spritesheet("mask", "/static/assets/monsters/mask.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // mimic
        this.load.spritesheet("mimic", "/static/assets/monsters/mimic.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // moai-b
        this.load.spritesheet("moai-b", "/static/assets/monsters/moai-b.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // moai-s
        this.load.spritesheet("moai-s", "/static/assets/monsters/moai-s.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // moai-g
        this.load.spritesheet("moai-g", "/static/assets/monsters/moai-g.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // mummy
        this.load.spritesheet("mummy", "/static/assets/monsters/mummy.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // mushroom
        this.load.spritesheet("mushroom", "/static/assets/monsters/mushroom.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // rabbit
        this.load.spritesheet("rabbit", "/static/assets/monsters/rabbit.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // reaper
        this.load.spritesheet("reaper", "/static/assets/monsters/reaper.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        //scorpion
        this.load.spritesheet("scorpion", "/static/assets/monsters/scorpion.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // skeleton
        this.load.spritesheet("skeleton", "/static/assets/monsters/skeleton.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // skull_b
        this.load.spritesheet("skull_b", "/static/assets/monsters/skull_b.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // skull_w
        this.load.spritesheet("skull_w", "/static/assets/monsters/skull_w.png", {
            frameWidth: 16,
            frameHeight: 16,
        });   
        // slime
        this.load.spritesheet("slime", "/static/assets/monsters/slime.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // snail
        this.load.spritesheet("snail", "/static/assets/monsters/snail.png", {
            frameWidth: 16,
            frameHeight: 16,
        });       
        // snake
        this.load.spritesheet("snake", "/static/assets/monsters/snake.png", {
            frameWidth: 16,
            frameHeight: 16,
        });   
        // squirrel
        this.load.spritesheet("squirrel", "/static/assets/monsters/squirrel.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // stingsnake
        this.load.spritesheet("stingsnake", "/static/assets/monsters/stingsnake.png", {
            frameWidth: 16,
            frameHeight: 16,
        });       
        // vampire
        this.load.spritesheet("vampire", "/static/assets/monsters/vampire.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // weapon
        this.load.spritesheet("weapon", "/static/assets/monsters/weapon.png", {
            frameWidth: 16,
            frameHeight: 16,
        });
        // wolf
        this.load.spritesheet("wolf", "/static/assets/monsters/wolf.png", {
            frameWidth: 16,
            frameHeight: 16,
        });   
        
        // ==================== 사운드 ========================
        // BGM
        this.load.audio("bgm_field", "/static/assets/sound/background/bgm_field.wav");

        // 몬스터/플레이어 관련
        this.load.audio("monster_hit", "/static/assets/sound/effects/monster_hit.wav");
        this.load.audio("monster_attack", "/static/assets/sound/effects/monster_attack.wav");
        this.load.audio("footstep", "/static/assets/sound/effects/footstep.wav");
        this.load.audio("monsterDeath", "/static/assets/sound/effects/monsterDeath.wav");
        this.load.audio("dash", "/static/assets/sound/effects/dash.wav");
        this.load.audio("portal", "/static/assets/sound/effects/portal.wav");

        // 아이템 관련
        this.load.audio("item_drop", "/static/assets/sound/effects/item_drop.wav");
        this.load.audio("item_pickup", "/static/assets/sound/effects/item_pickup.wav");
        this.load.audio("item_use", "/static/assets/sound/effects/item_use.wav");

        // 레벨/스킬
        this.load.audio("level_up", "/static/assets/sound/effects/level_up.wav");
        this.load.audio("stat_increase", "/static/assets/sound/effects/stat_increase.wav");

        // UI
        this.load.audio("ui_open", "/static/assets/sound/effects/ui_open.wav");
        this.load.audio("ui_close", "/static/assets/sound/effects/ui_close.wav");
        this.load.audio("ui_click", "/static/assets/sound/effects/ui_click.wav");

        // 스킬별
        this.load.audio("skill_fireball", "/static/assets/sound/effects/skill_fireball.wav");
        this.load.audio("skill_buff", "/static/assets/sound/effects/skill_buff.wav");
        this.load.audio("skill_flameA", "/static/assets/sound/effects/skill_flameA.wav");
        this.load.audio("skill_flameB", "/static/assets/sound/effects/skill_flameB.wav");
        this.load.audio("skill_flameC", "/static/assets/sound/effects/skill_flameC.wav");
        this.load.audio("skill_firebomb", "/static/assets/sound/effects/skill_firebomb.wav");
        this.load.audio("skill_incendiary", "/static/assets/sound/effects/skill_incendiary.wav");
        this.load.audio("skill_meteor_S", "/static/assets/sound/effects/skill_meteor_S.wav");
        this.load.audio("skill_meteor_M", "/static/assets/sound/effects/skill_meteor_M.wav");
        this.load.audio("skill_meteor_L", "/static/assets/sound/effects/skill_meteor_L.wav");
        this.load.audio("skill_napalm", "/static/assets/sound/effects/skill_napalm.wav");
        this.load.audio("skill_deathhand", "/static/assets/sound/effects/skill_deathhand.wav");
        // ... 나머지 스킬들도 필요에 따라 등록
        // ====================================================


        this.load.image("bullet", "/static/assets/bullet.png");
        this.load.image("item", "/static/assets/item.png");
        // this.load.image("shockwave", "/static/assets/effect_shockwave.png");

        for (const key of this.itemList) {
            this.load.image(key, `static/assets/${key}.png`)
        }

        for (const key of Object.keys(this.monsterData)) {
            // assets 경로는 key에 맞게 문자열 생성
            this.load.image(key, `/static/assets/${key}.png`);
        }
        // this.load.spritesheet("lightning", "/static/assets/electronic.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("waterwave", "/static/assets/waterwave.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("explosion", "/static/assets/explosion.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("fireflame", "/static/assets/fireflame.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("holycross", "/static/assets/holycross.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("voidsheild", "/static/assets/voidsheild.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        // this.load.spritesheet("wind", "/static/assets/wind.png", {
        //     frameWidth: 64,
        //     frameHeight: 64,
        // });
        preloadFireSkillAssets(this);
    }

    // !!) 매 scenc마다 player 객체가 새롭게 정의 (모든 스탯 초기화)
    // create() : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
    create() {
        setCurrentScene(this);
        
        // 사운드 ===========================================
        this.SoundManager = SoundManager.getInstance();
        this.footstepCooldown = 0;
        this.FOOTSTEP_INTERVAL = 315; // 발소리 간격 (ms)
        this.isMoving = false;        // 🔥 이동 여부 플래그 추가

        // 1. 씬 BGM
        this.SoundManager.playBgm("bgm_field")
        // ==================================================
        // 포탈
        this.anims.create({
            key: "portal-anim",
            frames: this.anims.generateFrameNumbers("portal", { start: 0, end: 6 }),
            frameRate: 12,
            repeat: -1
        });

        // 플레이어 이동
        this.anims.create({
            key: "player_walk",
            frames: this.anims.generateFrameNumbers("playerSheet", {
                start: 0,
                end: 5,
            }),
            frameRate: 10,
            repeat: -1,
        });

        // 플레이어 피격
        this.anims.create({
            key: "player_hit",
            frames: this.anims.generateFrameNumbers("playerSheet", {
                start: 30,
                end: 32,
            }),
            frameRate: 12,
            repeat: 0
        });

        // 플레이어 사망
        this.anims.create({
            key: "player_death",
            frames: this.anims.generateFrameNumbers("playerSheet", {
                start: 36,
                end: 40,
            }),
            frameRate: 8,
            repeat: 0
        });

        // //========================= 몬스터 이동 ================================
        // // 몬스터 종류별 이동 애니메이션 key 매핑
        // this.monsterWalkAnim = {
        //     arrow_skeleton: "arrow_skeleton_walk",
        //     bat: "bat_walk",
        //     bird: "bird_walk",
        //     butterfly: "butterfly_walk",
        //     coffin: "coffin_walk",
        //     colossus: "colossus_walk",
        //     dwarf: "dwarf_walk",
        //     eyeball: "eyeball_walk",
        //     eyebat: "eyebat_walk",
        //     fire_skull1: "fire_skull1_walk",
        //     fire_skull2: "fire_skull2_walk",
        //     ghost: "ghost_walk",
        //     lich: "lich_walk",
        //     mask: "mask_walk",
        //     mimic: "mimic",
        //     moai_b: "moai-b_walk",
        //     moai_s: "moai-s_walk",
        //     moai_g: "moai-g_walk",
        //     mummy: "mummy_walk",
        //     mushroom: "mushroom_walk",
        //     rabbit: "rabbit_walk",
        //     reaper: "reaper_walk",
        //     scorpion: "scorpion_walk",
        //     skeleton: "skeleton_walk",
        //     skull_b: "skull_b_walk",
        //     skull_w: "skull_w_walk",
        //     slime: "slime_walk",
        //     snail: "snail_walk",
        //     snake: "snake_walk",
        //     squirrel: "squirrel_walk",
        //     stingsnake: "stingsnake_walk",
        //     vampire: "vampire_walk",
        //     weapon: "weapon_walk",
        //     wolf: "wolf_walk",
        //     hidden: "hidden_walk",
        // };
        // arrow_skeleton
        this.anims.create({
            key: "arrow_skeleton_walk",
            frames: this.anims.generateFrameNumbers("arrow_skeleton", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        });
        // bat
        this.anims.create({
            key: "bat_walk",
            frames: this.anims.generateFrameNumbers("bat", { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1,
        });
        // bird
        this.anims.create({
            key: "bird_walk",
            frames: this.anims.generateFrameNumbers("bird", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });      
        // butterfly
        this.anims.create({
            key: "butterfly_walk",
            frames: this.anims.generateFrameNumbers("butterfly", { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // coffin
        this.anims.create({
            key: "coffin_walk",
            frames: this.anims.generateFrameNumbers("coffin", { start: 0, end: 10 }),
            frameRate: 8,
            repeat: -1,
        });
        // colossus
        this.anims.create({
            key: "colossus_walk",
            frames: this.anims.generateFrameNumbers("colossus", { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1,
        });
        // dwarf
        this.anims.create({
            key: "dwarf_walk",
            frames: this.anims.generateFrameNumbers("dwarf", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });  
        // eyeball
        this.anims.create({
            key: "eyeball_walk",
            frames: this.anims.generateFrameNumbers("eyeball", { start: 0, end: 14 }),
            frameRate: 8,
            repeat: -1,
        });
        // eyebat
        this.anims.create({
            key: "eyebat_walk",
            frames: this.anims.generateFrameNumbers("eyebat", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        });
        // fire_skull1
        this.anims.create({
            key: "fire_skull1_walk",
            frames: this.anims.generateFrameNumbers("fire_skull1", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        });       
        // fire_skull2
        this.anims.create({
            key: "fire_skull2_walk",
            frames: this.anims.generateFrameNumbers("fire_skull2", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        });
        // ghost
        this.anims.create({
            key: "ghost_walk",
            frames: this.anims.generateFrameNumbers("ghost", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        });
        // lich
        this.anims.create({
            key: "lich_walk",
            frames: this.anims.generateFrameNumbers("lich", { start: 0, end: 7 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // mask
        this.anims.create({
            key: "mask_walk",
            frames: this.anims.generateFrameNumbers("mask", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // mimic
        this.anims.create({
            key: "mimic_walk",
            frames: this.anims.generateFrameNumbers("mimic", { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1,
        });
        // moai-b
        this.anims.create({
            key: "moai-b_walk",
            frames: this.anims.generateFrameNumbers("moai-b", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // moai-s
        this.anims.create({
            key: "moai-s_walk",
            frames: this.anims.generateFrameNumbers("moai-s", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // moai-g
        this.anims.create({
            key: "moai-g_walk",
            frames: this.anims.generateFrameNumbers("moai-g", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // mummy
        this.anims.create({
            key: "mummy_walk",
            frames: this.anims.generateFrameNumbers("mummy", { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1,
        });
        // mushroom
        this.anims.create({
            key: "mushroom_walk",
            frames: this.anims.generateFrameNumbers("mushroom", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        });
        // rabbit
        this.anims.create({
            key: "rabbit_walk",
            frames: this.anims.generateFrameNumbers("rabbit", { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1,
        });
        // reaper
        this.anims.create({
            key: "reaper_walk",
            frames: this.anims.generateFrameNumbers("reaper", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        });
        // scorpion
        this.anims.create({
            key: "scorpion_walk",
            frames: this.anims.generateFrameNumbers("scorpion", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        });
        // skeleton
        this.anims.create({
            key: "skeleton_walk",
            frames: this.anims.generateFrameNumbers("skeleton", { start: 0, end: 8 }),
            frameRate: 8,
            repeat: -1,
        });  
        // skull_b
        this.anims.create({
            key: "skull_b_walk",
            frames: this.anims.generateFrameNumbers("skull_b", { start: 0, end: 12 }),
            frameRate: 8,
            repeat: -1,
        });  
        // skull_w
        this.anims.create({
            key: "skull_w_walk",
            frames: this.anims.generateFrameNumbers("skull_w", { start: 0, end: 12 }),
            frameRate: 8,
            repeat: -1,
        });
        // slime
        this.anims.create({
            key: "slime_walk",
            frames: this.anims.generateFrameNumbers("slime", { start: 0, end: 15 }),
            frameRate: 8,
            repeat: -1,
        });
        // snail
        this.anims.create({
            key: "snail_walk",
            frames: this.anims.generateFrameNumbers("snail", { start: 0, end: 11 }),
            frameRate: 8,
            repeat: -1,
        });
        // snake
        this.anims.create({
            key: "snake_walk",
            frames: this.anims.generateFrameNumbers("snake", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
        // squirrel
        this.anims.create({
            key: "squirrel_walk",
            frames: this.anims.generateFrameNumbers("squirrel", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        });
        // stingsnake
        this.anims.create({
            key: "stingsnake_walk",
            frames: this.anims.generateFrameNumbers("stingsnake", { start: 0, end: 4 }),
            frameRate: 8,
            repeat: -1,
        });
        // vampire
        this.anims.create({
            key: "vampire_walk",
            frames: this.anims.generateFrameNumbers("vampire", { start: 0, end: 11 }),
            frameRate: 8,
            repeat: -1,
        });
        // weapon
        this.anims.create({
            key: "weapon_walk",
            frames: this.anims.generateFrameNumbers("weapon", { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // wolf
        this.anims.create({
            key: "wolf_walk",
            frames: this.anims.generateFrameNumbers("wolf", { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1,
        }); 
        // =========================
        // === 스킬 모션 애니메이션 ===
        // fireball / firebomb / incendiary / napalm
        this.anims.create({
            key: "player_cast_small",
            frames: this.anims.generateFrameNumbers("playerSheet", { start: 18, end: 21 }),
            frameRate: 12,
            repeat: 0
        });

        // buff skill
        this.anims.create({
            key: "player_buff",
            frames: this.anims.generateFrameNumbers("playerSheet", { start: 24, end: 27 }),
            frameRate: 10,
            repeat: 0
        });

        // meteor S, M, L / deathhand / flameA,B,C
        this.anims.create({
            key: "player_cast_big",
            frames: this.anims.generateFrameNumbers("playerSheet", { start: 42, end: 47 }),
            frameRate: 10,
            repeat: 0
        });

        // incendiary 전용 — 홀드 유지 프레임 반복(20~21)
        this.anims.create({
            key: "player_incendiary_loop",
            frames: this.anims.generateFrameNumbers("playerSheet", { start: 20, end: 21 }),
            frameRate: 6,
            repeat: -1
        });

        // this.anims.create({
        //     key: "lightning-burst",
        //     frames: this.anims.generateFrameNumbers("lightning", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 0
        // });
        // this.anims.create({
        //     key: "water-wave",
        //     frames: this.anims.generateFrameNumbers("waterwave", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });
        // this.anims.create({
        //     key: "explosion-bomb",
        //     frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });
        // this.anims.create({
        //     key: "fire-shot",
        //     frames: this.anims.generateFrameNumbers("fireflame", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });
        // this.anims.create({
        //     key: "holy-cross",
        //     frames: this.anims.generateFrameNumbers("holycross", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });
        // this.anims.create({
        //     key: "void-sheild",
        //     frames: this.anims.generateFrameNumbers("voidsheild", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });
        // this.anims.create({
        //     key: "wind-blow",
        //     frames: this.anims.generateFrameNumbers("wind", { start: 0, end: 5 }),
        //     frameRate: 18,
        //     repeat: 1
        // });

        // 스킬 애니메이션 매핑
        this.skillMotionType = {
            fireball: "small",
            firebomb: "small",
            napalm: "small",
            incendiary: "small",      // 시작 애니메이션
            // incendiary_hold: "incendiary-hold",

            buff: "buff",

            meteor_S: "big",
            meteor_M: "big",
            meteor_L: "big",
            deathhand: "big",
            flameA: "big",
            flameB: "big",
            flameC: "big",
        };

        this.uiState = {
            inventory: false,
            skill: false,
            stat: false,
            menu: false,
            sound: false,   // ⭐ 추가

        };

        // 맵 크기 설정 (물리적 공간 범위 설정)
        this.physics.world.setBounds(0, 0, CFG.world.width, CFG.world.height);

        // 카메라의 이동 범위 설정
        // 카메라의 범위는 게임의 비율과 줌 수준으로 결정
        this.cameras.main.setBounds(0, 0, CFG.world.width, CFG.world.height);

        const map = this.add.image(0, 0, "map2").setOrigin(0);
        const tile = this.make.tilemap({key: 'map2Tile'});
        const collisionObjects = tile.getObjectLayer("collider");

        

        // 맵 이미지를 맵 크기에 맞춰 변경
        map.displayWidth = CFG.world.width;
        map.displayHeight = CFG.world.height;

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

        // 🔥 추가: 캐스팅 플래그
        this.player.isCasting = false;

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

        this.isPlayerLoad = false;
        initPlayer(1).then(player => {
            this.playerStats = player;
        })
        initInventory(1).then(inven => {
            this.inventoryData = inven;
        })
        initSlot(1).then(slot => {
            this.slotData = slot;
            this.isPlayerLoad = true;
        })

        // 카메라가 Player(gameObject)를 추적하도록 설정
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

        // 인벤토리 구현
        // this.inventory = { items: [] };
        // this.inventory.items.push(
        //     {
        //         name: "hpPotion",
        //         icon: "static/assets/hpPotion.png",
        //         count: 2,
        //         effect: 0.3,
        //     },
        //     {
        //         name: "mpPotion",
        //         icon: "static/assets/mpPotion.png",
        //         count: 1,
        //         effect: 0.2,
        //     }
        // );

        this.skills = createDefaultSkills(this);

        // 시스템 메세지 창
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
        this.portal = this.physics.add.sprite(1400, 600, "portal");
        this.portal.portalId = "east"; // ⭐ 포탈 ID

        // 애니메이션 생성 (한번만 생성되도록 체크)
        if (!this.anims.exists("portal-anim")) {
            this.anims.create({
                key: "portal-anim",
                frames: this.anims.generateFrameNumbers("portal", { start: 0, end: 6 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // 애니메이션 재생
        this.portal.play("portal-anim");

        this.portal.setOrigin(0.5);
        this.portal.setImmovable(true);
        this.portal.setScale(1.0);
        // 상호작용 가능 여부
        this.canInteract = false;

        this.interactText = this.add.text(
            this.portal.x, 
            this.portal.y, 
            "F 키를 눌러 이동", 
            {
            fontSize: "22px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.45)",
            padding: { x: 8, y: 4 }
            }
        )
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(9999);

        // 플레이어가 포탈 위에 올라가면
        this.physics.add.overlap(this.player, this.portal, () => {
            this.canInteract = true;
            this.interactText.setVisible(true);
        });
        // F 키 등록
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);


    }

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

    /** skill upgrade */
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

    useSkill(slotIdx) {
        const name = this.slotData.skillSlots[slotIdx];
        if (!name) return;

        const skill = this.skills[name];
        if (!skill) return;

        // --- 시전 전 상태 백업 ---
        const prevMp = this.playerStats.mp;
        const prevLastCastAt = skill.lastCastAt;
        const prevActive = skill.active;

        // 🔥 실제 스킬 시전 시도 (쿨타임/마나/조건은 스킬 안에서 판단)
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

        // 스킬 캐스팅 사운드
        this.SoundManager.playSkillCast(name);

        // 🔥 여기까지 왔으면 "실제로 스킬이 발동된 것"만 남음
        const motionType = this.skillMotionType[name];
        if (motionType) {
            this.playPlayerSkillMotion(motionType, skill.isHoldSkill === true);
        }

        // hold 스킬이면 이동 정지
        if (skill.isHoldSkill) {
            this.player.setVelocity(0, 0);
        }
    }


    /** use item */
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

    // update() : 유니티의 update()와 동일 (프레임 단위 호출) - TODO
    update(time, delta) {
        if (!this.playerStats) return;  // playerStats 로딩 전 update 차단
        if (this.player?.isDead) return;
        
        const now = this.time.now;

        // 발소리 사운드 쿨타임
        this.footstepCooldown -= delta;

        // TODO: 넉백 확인 >> 피격 함수로 이전
        this.handlePlayerKnockback();
        // TODO: 시간에 따른 대쉬 감속/정지 >> coroutine으로 대쉬 함수에 편입 가능한지 확인
        this.handleDash(now);
        this.handleMovement();
        this.updateMonsters(now);
        // TODO: 몬스터 사망 및 아이템 드롭 >> 몬스터 피격 함수로 이전
        this.checkMonstersDeath();
        this.updateMonsterHud();

        // 🔥 이동 중일 때 일정 간격으로 발소리 재생
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
        // 🔥 Hold(키다운) 스킬 처리 — incendiary 전용
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

            // 🔥 키를 누르고 있는 동안 지속 발사
            if (phaserKey.isDown) {
                if (!skill.active) {
                    skill.tryCast(this, this.player);
                }
            }

            // 🔥 키에서 손 떼면 종료
            if (Phaser.Input.Keyboard.JustUp(phaserKey)) {
                if (skill.stop) skill.stop();

                // 🔥 hold 스킬 끝났으니 캐스팅 플래그 및 애니 정리
                this.player.isCasting = false;
                this.player.anims.stop();
                this.player.setFrame(0);
            }
        }


        // if (this.count >= 300) {
        //     this.scene.start('TestScene3');
        // }

        // === 포탈 상호작용 체크 ===
        if (this.canInteract) {

            // F 누르면 이동
            if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
                this.moveToNextScene();
            }

            // 포탈에서 벗어나면 상호작용 불가 처리
            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                this.portal.x, this.portal.y
            );

            if (dist > 160) {  // 포탈 범위 밖
                this.canInteract = false;
                this.interactText.setVisible(false);
            }
        }
    }

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

        // 🔥 이동 여부 플래그 갱신
        this.isMoving = moving;

        if (moving) {
            // 캐스팅 중이면 walk 애니로 덮어쓰지 않음
            if (!this.player.isCasting) {
                if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "player_walk") {
                    this.player.play("player_walk", true);
                }
            }
        } else {
            // 캐스팅 중이면 애니 stop 하지 않음
            if (!this.player.isCasting) {
                this.player.anims.stop();
                this.player.setFrame(0);  // 기본 프레임 유지
                
            }
            // 🔥 멈춘 순간 쿨타임 리셋 → 다시 움직이면 바로 소리 나게
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
        // 몬스터 피격 sound
        this.SoundManager.playMonsterHit();

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
        if (!itemSprite.getData('pickDef')) return;

        const def = itemSprite.getData('pickDef');
        const exist = this.inventoryData.inventory.items.find((i) => i.name === def.name);

        if (exist) exist.count += def.count || 1;
        else this.inventoryData.inventory.items.push({ ...def }); // Spread Operator : 객체의 모든 속성을 새로운 객체에 복사

        itemSprite.destroy();
        // 아이템 획득 사운드
        this.SoundManager.playItemPickup();
        this.textBar = `${def.name} 획득`;
    };

    /** 플레이어 피격 - TODO */
    onPlayerHitByMonster = (player, monster) => {
        if (!player || !monster) return;

        // 🔥 키다운 스킬(incendiary) 사용 중이면 즉시 끊기
        if (this.activeHoldSkill) {
            const s = this.skills[this.activeHoldSkill];
            if (s && s.stop) s.stop();
            this.activeHoldSkill = null;
        }
        
        // TODO: 존재 이유 확인
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

            // 🔥 1) 플레이어 physics 충돌 완전 비활성화
            player.body.enable = false;

            // 🔥 2) 반동을 전혀 주지 않도록 속도 제거
            player.setVelocity(0, 0);

            // 🔥 몬스터들이 플레이어에 의해 밀리지 않도록 충돌 반응 차단
            this.monsters.children.iterate(m => {
                if (!m || !m.body) return;

                m.setVelocity(0, 0);   // 즉시 멈춤
                m.body.immovable = true;  // 반발력 제거
            });

            // 🔥 4) 사망 루틴 실행
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
    onPlayerDeath() {
        if (this.player.isDead) return; // 중복 사망 방지
        this.player.isDead = true;

        // HP 0 이하 — 사망 상태
        this.textBar = "사망했습니다.";

        // 모든 움직임 차단
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // 슬로우 모션 사망 애니메이션 재생
        const deathAnim = this.player.play("player_death");

        // timeScale 적용 (애니메이션 속도 0.4배)
        deathAnim.timeScale = 0.4;

        // 사망 애니 끝난 뒤 → 2초 기다렸다가 부활
        this.player.once("animationcomplete-player_death", () => {

            this.time.delayedCall(2000, () => {
                // 플레이어 HP 회복
                this.playerStats.hp = this.playerStats.maxHp * 0.3;

                // 부활 위치로 이동 (원하는 좌표로 직접 설정 가능)
                this.player.x = 400;
                this.player.y = 300;

                // 캐릭터 상태 복구
                this.player.setFrame(0);
                this.player.body.enable = true;
                this.player.isDead = false;

                // 카메라 플래시로 부활 연출
                this.cameras.main.flash(300);

                this.textBar = "부활했습니다!";
            });
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
                this.showDamageText(monster, dot.damage, "#ffffff");
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
    updateMonsters(now) {
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

            // // 2) 얼음(빙결) 상태면 멈춤
            // if (m.isFrozen) {
            //     m.setVelocity(0);
            //     return;
            // }

            // 3) 어그로 상태면 플레이어 추격 (기존 로직 유지)
            if (m.isAggro) {
                this.physics.moveToObject(m, this.player, 95);

                // 🔥 추격 방향에 따라 좌우 반전
                const vx = m.body?.velocity?.x ?? 0;
                if (vx < 0) m.flipX = false;
                else if (vx > 0) m.flipX = true;

                return;
            }

            // 4) 그 외에는 “짧게 왔다갔다” 배회
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

    // 🔥 속도 상향 (테스트용)
    const speed = monster.wanderSpeed || 80;  
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    monster.setVelocity(vx, vy);

    // 🔥 확실한 flip 처리
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
            
            // 🔥 몬스터 사망 사운드
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
            // this.time.delayedCall(400, () => {
            //     if (m && m.destroy) m.destroy();
            // });
        });
    }

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

    /**
     * 즉발 원형 광역 데미지
     * FireBomb, Meteor, Deathhand 등이 사용
     */
    damageArea({ x, y, radius, dmg, onHit }) {
        if (!this.monsters) return;

        let hitSomething = false;

        this.monsters.children.iterate((monster) => {
            if (!monster || !monster.active) return;

            const dx = monster.x - x;
            const dy = monster.y - y;
            if (dx * dx + dy * dy > radius * radius) return;

            monster.hp -= dmg;
            this.showDamageText(monster, dmg, "#ffffff");
            if (this.spawnHitFlash) this.spawnHitFlash(monster.x, monster.y);
            if (typeof this.onMonsterAggro === "function") {
                this.onMonsterAggro(monster);
            }

            hitSomething = true;
        });

        if (hitSomething && typeof onHit === "function") {
            onHit();
        }
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
                    this.showDamageText(monster, tickDmg, "#ffffff");
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

            this.showDamageText(monster, dmg, "#ffffff");
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

    //   /**
    //    * 원뿔(콘) 형태 광역 데미지 – Incendiary 전용
    //    * originX, originY 기준으로 dir 방향, radius, angleRad 각도 안에 있는 몬스터에게 피해
    //    */
    //   damageCone({ originX, originY, dir, radius, angleRad, dmg }) {
    //     if (!this.monsters) return;

    //     const nx = dir.x;
    //     const ny = dir.y;
    //     const halfA = angleRad * 0.5;

    //     this.monsters.children.iterate((monster) => {
    //       if (!monster || !monster.active) return;

    //       const vx = monster.x - originX;
    //       const vy = monster.y - originY;
    //       const dist2 = vx * vx + vy * vy;
    //       if (dist2 > radius * radius) return;

    //       const len = Math.sqrt(dist2);
    //       if (len === 0) return;

    //       // 몬스터 방향 벡터와 dir 벡터 사이의 각
    //       const dot = (vx * nx + vy * ny) / len; // = cos(theta)
    //       if (dot <= 0) return; // 뒤쪽은 무시

    //       const theta = Math.acos(Math.max(-1, Math.min(1, dot)));
    //       if (theta > halfA) return;

    //       monster.hp -= dmg;
    //       if (this.spawnHitFlash) {
    //         this.spawnHitFlash(monster.x, monster.y);
    //       }
    //       if (typeof this.onMonsterAggro === "function") {
    //         this.onMonsterAggro(monster);
    //       }
    //     });
    //   }

    /** F 키로 다음 Scene 이동 (데이터 유지됨) */
    moveToNextScene() {
        // 🔥 포탈 사운드 재생
        this.SoundManager.playPortal();

        if(!this.scene.get('TestScene3')) this.scene.add('TestScene3', TestScene3);

        this.cameras.main.fadeOut(300, 0, 0, 0);

        this.time.delayedCall(300, () => {
            this.scene.start("TestScene3", {
                playerStats: this.playerStats,
                inventoryData: this.inventoryData,
                slotData: this.slotData,
                fromPortal: "east",
                spawnX: this.portal.x,
                spawnY: this.portal.y + 60
            });
        });
    }

    collectPlayerData() {
        return {
            stats: this.playerStats,
            inventory: this.inventoryData,
            slots: this.slotData,
            scene: this.scene.key
        };
    }

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


