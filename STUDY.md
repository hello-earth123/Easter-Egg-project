# Project

## 구조

### Phaser

1. 게임 실행 및 렌더링
2. 게임 Scene 처리
3. 데이터 변경 이벤트 발생

### Vue

1. UI 구성
2. 이벤트로 변경된 데이터 관리
3. 페이지 전환

Vue Component에서 Phaser를 Canvas로 mount해서 동작

### Django

1. 백엔드 서버
2. API 제공

### DB

1. 데이터 저장

## TODO

### /config/...

Config.js

1. ~~동일한 몬스터 스폰량 수정 (맵 별 변동 방법 구상)~~
   > 각 Scene에 등장 몬스터, 개체 수 바인딩
2. 몬스터 추가

### /effects/...

Effect.js

1. 일반공격(bullet)과의 일관성 확보 - /skills/...
2. 이펙트 추가?

### /entities/...

MonsterFactory.js

1. 몬스터에 sprite 연결
2. MainScene.js의 물리엔진 및 일부 함수 이관 (Singleton)

### /items/...

Inventory.js

1. 아이템 ID 일관성 확보
2. DB와 어떻게 연결할 것인지 고민

- models.py에 item DB 생성
- models.py에 inventory DB 생성
- 게임 시작 시, inventory_model을 singleton 객체로 생성
- 게임 종료 시, 해당 singleton 객체의 정보를 기반으로 DB 저장

### /player/...

player.js

1. MainScene.js의 물리엔진 및 일부 함수 이관 고려 (Singleton)  
   ※ 각 scene에서 state를 새롭게 정의하므로 플레이어의 state 정보가 초기값으로 초기화 되는 중

### /scenes/...

MainScene.js

1. preload, create의 중첩되는 요소에 대한 singleton 처리
2. 일부 함수의 병합 가능성 확인 및 병합
3. onPlayerHitByMonster() 함수에서 player.\_lastHitAt 초기화 부분 재확인

# Phaser

HTML5로 제작된 웹 브라우저용 2D 게임 엔진

## 구조

### Phaser.Game

[ 전체 설정 관리 ]  
※ Vue를 프론트엔드로 사용하기 때문에 main.js 대신 **src/components/Game.vue**에서 통합 설정을 담당

```
- main.js -

import Phaser from 'phaser';

/** 기본 설정값 */
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
};

/** 작성한 설정을 기반으로 Game 생성 */
new Phaser.Game(config);
```

[ Scene 관리 ]

```
각 Scene은 동일한 디렉토리 레벨에 위치한 개별 파일로 존재한다.
이후 Phaser.Game을 통해 어떠한 Scene이 게임에 존재하는지(접근 가능한지) 저장한다.
(유니티의 Build Setting과 동일)
```

```
- main.js -

import Phaser from 'phaser';

/** 등록할 Scene */
import MainScene from './scenes/MainScene.js';
import SubScene from './scenes/SubScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,

  /** Scene 등록 */
  scene: [MainScene, SubScene],
};

new Phaser.Game(config);
```

### Scene

[ Preload, Create, Update 메서드 정의 ]

```
- Preload   : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
- Create    : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
- Update    : 유니티의 update()와 동일 (프레임 단위 호출)
```

[ constructor를 통한 Scene 생성 ]

```
JavaScript 클래스의 생성자 함수로 Scene 객체를 생성할 때 사용된다.
Scene 전환을 위한 고유한 이름을 설정하고 해당 Scene에서 사용될 변수를 선언한다.

※ Create 단계에서 이때 선언된 변수에 값을 할당하는 것으로 해당 변수를 실질적으로 생성한다.
```

```
export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });

        this.INSTACNE_VALUE = INITIAL_VALUE;
    }
}

※ export default : 해당 클래스를 모듈로써 외부에서의 접근이 가능하도록 설정
```

### GameObject

[ Scene에 배치되는 시각적 요소 ]

```
this.add.sprite()
```

### Input Manager

[ 유저 입력 감치 및 처리 ]

```
this.OBJECT = this.input.keyboard.createCursorKeys() : 방향키 및 space, shift에 대한 키 객체 생성
this.OBJECT = this.input.keyboard.addKeys("KEY_VALUE") : 입력 받을 키에 대한 키 객체 생성
※ 이벤트 리스너를 사용하지 않는 경우, Phaser에서는 키 객체를 경유하여 해당 키에 대한 상태를 확인

KEY_OBJECT.on("STATE", () => FUNCTION()) : 특정 키 입력 및 이벤트에 따른 함수 설정
this.input.keyboard.on("STATE", () => FUNCTION()) : 모든 키 입력에 대해 이벤트에 따른 함수 설정
※ state : down, up, hold

Phaser.Input.Keyboard.JustDown(KEY_OBJECT) : 프레임 단위로 특정 키 입력 확인
※ .on 메서드의 경우, 1회 입력에 대한 처리가 이루어지지만 .JustDown 메서드의 경우, 매 프레임 단위로 키 입력에 대한 처리가 이루어짐
```

### Physics Engine

[ 물리 시뮬레이션 ]

```
this.physics.add.sprite(x, y, key, [frame]) : 애니메이션이 존재하는 sprite 이미지에 물리 객체 및 collider 추가
this.physics.add.image(x, y, texture, [frame]) : 단일 이미지에 물리 객체 및 collider 추가
this.physics.add.staticSprite(x, y, texture, [frame]) : 고정 객체에 물리 객체 및 collider 추가
※ key / texture : 로드한 이미지에 대한 이름으로 각각 sprite 객체, image 객체에 대한 구분
※ frame : Atlas의 n번째 이미지를 의미

this.physics.add.group([children], [config]) : 비슷한 물리 객체를 묶어 관리할 수 있도록 group 생성
this.physics.add.staticGroup([children], [config]) : 고정 물리 객체 group 생성

this.physics.add.existing(gameObject, [isStatic]) : 이미 존재하는 gameObject에 물리 객체 추가
this.physics.add.collider(object1, object2, [collideCallback], [processCallback], [context]) : 충돌을 검사/처리하는 collider 생성
this.physics.add.overlap(object1, object2, [collideCallback], [processCallback], [context]) : 겹침을 체크하는 collider
※ object1, object2 : 충돌 검사를 할 대상 (객체, group)
※ processCallback : 실제 충돌 처리 여부
```

### Loader

[ 리소스 로드 ]

```
this.load.image()
```

# Design Pattern

## Singleton Pattern

모든 Scene에서 동일하게 사용되는 것을 매번 constructor에서 선언하고 생성하는 것을 옳지 않다.
