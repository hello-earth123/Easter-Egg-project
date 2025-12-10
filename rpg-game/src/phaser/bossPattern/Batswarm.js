import { BossPatternBase } from "./BossPatternBase";

export class Batswarm extends BossPatternBase {
  cast(scene, caster) {
    // 발사 시작 위치
    const sx = caster.x;
    const sy = caster.y;

    // 도달점
    const ex = scene.player.x;
    const ey = scene.player.y;

    // 방향 벡터 생성
    const dir = new Phaser.Math.Vector2(ex - sx, ey - sy).normalize();

    // 예고 이펙트 추가

    // 실 패턴 사용
    scene.time.delayedCall(500, () => {
        const b = scene.pattern.create(sx, sy, "batswarm");
        b.setOrigin(0.5);

        const scale = this.base.scale ?? 1.0;
        b.setScale(scale);

        b.play("batswarm");

        b.rotation = Math.atan2(dir.y, dir.x);

        const speed = this.base.speed ?? 500;
        b.setVelocity(dir.x * speed, dir.y * speed);

        b.damage = this.getDamage();

        scene.time.delayedCall(800, () => {
            if (b && b.active) b.destroy();
        });
    })
  }
}