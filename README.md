# 게임 개발

## 장르 : RPG

## 스토리

갑작스레 실종되는 마을 사람들과 공동묘지에서 들려오는 이상한 소음에 마을 사람들은 길드에 탐색 의뢰를 내건다.
길드는 가벼운 퀘스트라 여겨, 촉망 받는 신인 모험가를 파견시킨다.
...
...
...
이것은 내가 A급 용병이 될 때까지의 이야기다. [First Eester-Egg]

## 플레이 시스템

### main stream - 2

묘지

은신처

### 캐릭터

HP : 0이 되면 패배하며 자연 회복 및 소모품으로 회복할 수 있다. 사망 시에 해당 메인 scene에 해당하는 마을로 이동한다.
MP : 스킬을 사용할 때 소모되는 자원으로 자연 회복 외에는 회복할 수 없다.

### 스킬

스킬의 획득은 랜덤 드롭되는 스킬북으로 한다.

### 인벤토리

inventory = {
----money,
----item : {
--------food,
--------home scroll,
--------key,  
----},
}

## DB

### 계정 정보

로그인 정보 = {
----'ID': 아이디,
----'PW': 비밀번호,
}

인게임 정보 = {
----'Nickname' : 닉네임,
----'Save' : {
--------'Character' : {
--------'location' : 위치정보,
--------'LV' : 캐릭터 레벨,
--------'exp' : 캐릭터 경험치,
--------'status' : 캐릭터 스테이터스,
--------'HP' : 캐릭터 HP,
--------'MP' : 캐릭터 MP,
--------'Skill' : 획득 스킬,
--------'Inventory' : 소지품,
--------},
----'Quest' : 현재 퀘스트,
----}
}

rpg-game/
├─ backend/ (Django)
│ ├─ manage.py
│ ├─ accounts/ # 로그인, 계정 관리
│ ├─ game/ # 캐릭터, 몬스터, 인벤토리, 스킬 등
│ ├─ db.sqlite3
│ └─ ...
├─ frontend/ (Vue.js + Phaser)
│ ├─ public/
│ ├─ src/
│ │ ├─ main.js
│ │ ├─ App.vue
│ │ ├─ components/
│ │ │ └─ Game.vue
│ │ └─ phaser/
│ │ └─ scenes/
│ │ ├─ MainScene.js
│ │ └─ BattleScene.js
│ └─ package.json
