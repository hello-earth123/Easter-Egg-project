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

        // 예고 이펙트
        const spacing = 16 * 3;   // path width: 15, bat scaling: 1.5 (여러 마리가 한 폭을 담당하므로 좀 더 크게)
        const maxDistance = 1600;
        const angle = Phaser.Math.Angle.Between(0, 0, dir.x, dir.y);

        const paths = [];
        for (let i = spacing; i < maxDistance; i += spacing) {
            const x = sx + dir.x * i;
            const y = sy + dir.y * i;

            const img = scene.add.sprite(x, y, 'path');
            img.setOrigin(0, 0.5);
            img.setScale(3);
            img.setRotation(angle);
            img.setTint(0x6ed953);
            img.play('path');

            paths.push(img);
        }

        scene.time.delayedCall(500, () => {
            // 예고 이펙트 삭제
            paths.forEach(img => img.destroy());

            // 실 패턴 사용
            for (let i = 0; i < 10; i++) {
                scene.time.delayedCall(i * 30, () => {
                    for (let j = 0; j < 5; j++) {
                        const spreadX = Phaser.Math.Between(-15, 15);
                        const spreadY = Phaser.Math.Between(-15, 15);
                        const b = scene.pattern.create(sx + spreadX, sy + spreadY, "batswarm");
                        b.setOrigin(0.5);

                        const scale = this.base.scale ?? 1.0;
                        b.setScale(scale);

                        b.play("batswarm");

                        if (sx >= ex) {
                            b.flipX = true;
                        }

                        const speed = this.base.speed ?? 500;
                        b.setVelocity(dir.x * speed, dir.y * speed);

                        b.damage = this.getDamage();

                        scene.time.delayedCall(2000, () => {
                            if (b && b.active) b.destroy();
                        });
                    }
                })
            }
            caster.isAttack = false;
            caster.isFrozen = false;
        })
    }
}