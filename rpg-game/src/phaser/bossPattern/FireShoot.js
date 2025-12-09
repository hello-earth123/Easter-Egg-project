import { BossPatternBase } from "./BossPatternBase";

function getDir(caster) {
        if (!caster || !caster.facing) {
            return new Phaser.Math.Vector2(1, 0); // fallback (오른쪽)
        }
        return new Phaser.Math.Vector2(caster.facing.x, caster.facing.y).normalize();
}

export class FireShoot extends BossPatternBase {
  cast(scene, caster) {
    const dir = getDir(caster);

    // 발사 시작 위치
    const sx = caster.x;
    const sy = caster.y;

    const baseAngle = Math.atan2(dir.y, dir.x);

    // 실 패턴 사용
    scene.time.delayedCall(500, () => {
        for(let i=0; i<100; i++){
          scene.time.delayedCall(i * 30, () => {
            const b = scene.pattern.create(sx, sy, "fireball");
            b.setOrigin(0.5);

            const scale = this.base.scale ?? 1.0;
            b.setScale(scale);

            b.play("fireball");

            const angle = baseAngle + (i * 13);
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            b.rotation = angle;
            
            const speed = this.base.speed ?? 500;
            b.setVelocity(dx * speed, dy * speed);

            b.damage = this.getDamage();

            scene.time.delayedCall(800, () => {
            if (b && b.active) b.destroy();
            });
          })
        }
    })
  }
}
