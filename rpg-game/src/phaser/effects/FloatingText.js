/** 데미지 출력용 Floating Text Class */
export class FloatingText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, color = "#fff") {
    super(scene, x, y, text, {
      font: "18px Arial",
      fill: color,
      stroke: "#000",
      strokeThickness: 3,
      align: "center",
    });

    scene.add.existing(this);
    this.setOrigin(0.5);
    this.alpha - 1;

    // 살짝 위로 떠오르며 사라짐
    scene.tweens.add({
      targets: this,
      y: y - 30,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => this.destroy(),
    });
  }
}
