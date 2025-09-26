import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }

  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("monster", "assets/monster.png");
    this.load.image("bullet", "assets/bullet.png");
  }

  create() {
    this.player = this.physics.add.sprite(400, 300, "player");
    this.player.hp = 100;
    this.player.mp = 50;

    this.monsters = this.physics.add.group();
    for (let i = 0; i < 5; i++) {
      let monster = this.monsters.create(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(50, 550),
        "monster"
      );
      monster.hp = 50;
    }

    this.bullets = this.physics.add.group();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("Q,W,E,R");

    this.physics.add.overlap(
      this.bullets,
      this.monsters,
      this.hitMonster,
      null,
      this
    );
  }

  update() {
    this.handleMovement();
    this.handleSkills();
    this.moveMonsters();
  }

  handleMovement() {
    this.player.setVelocity(0);
    if (this.cursors.left.isDown) this.player.setVelocityX(-200);
    if (this.cursors.right.isDown) this.player.setVelocityX(200);
    if (this.cursors.up.isDown) this.player.setVelocityY(-200);
    if (this.cursors.down.isDown) this.player.setVelocityY(200);
  }

  handleSkills() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) && this.player.mp >= 10) {
      this.player.mp -= 10;
      let bullet = this.bullets.create(this.player.x, this.player.y, "bullet");
      bullet.setVelocityY(-300);
      this.cameras.main.shake(50, 0.002);
    }
  }

  moveMonsters() {
    this.monsters.children.iterate((monster) => {
      if (monster.hp > 0) {
        this.physics.moveToObject(monster, this.player, 100);
      }
    });
  }

  hitMonster(bullet, monster) {
    bullet.destroy();
    monster.hp -= 20;
    this.cameras.main.shake(100, 0.01);
    if (monster.hp <= 0) {
      monster.destroy();
    }
  }
}
