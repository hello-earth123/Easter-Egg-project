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

# Phaser
HTML5로 제작된 웹 브라우저용 2D 게임 엔진

## 구조
### Phaser.Game
[ 전체 설정 관리 ]
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
~~~
각 Scene은 동일한 디렉토리 레벨에 위치한 개별 파일로 존재한다.
이후 Phaser.Game을 통해 어떠한 Scene이 게임에 존재하는지(접근 가능한지) 저장한다.
(유니티의 Build Setting과 동일)
~~~
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
~~~
- Preload   : 유니티의 Awake()와 같이 Scene이 시작되기 전, resource를 로드
- Create    : 유니티의 Start()와 같이 preload() 동작 이후 오브젝트 초기화
- Update    : 유니티의 update()와 동일 (프레임 단위 호출)
~~~

[ constructor를 통한 Scene 생성 ]
~~~
JavaScript 클래스의 생성자 함수로 Scene 객체를 생성할 때 사용된다.
Scene 전환을 위한 고유한 이름을 설정하고 해당 Scene에서 사용될 변수를 선언한다.

※ Create 단계에서 이때 선언된 변수에 값을 할당하는 것으로 해당 변수를 실질적으로 생성한다.
~~~
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
this.input.keyboard
```

### Physics Engine
[ 물리 시뮬레이션 ]
```
this.physics.add.existing()
```

### Loader
[ 리소스 로드 ]
```
this.load.image()
```

# Design Pattern
## Singleton Pattern
모든 Scene에서 동일하게 사용되는 것을 매번 constructor에서 선언하고 생성하는 것을 옳지 않다.