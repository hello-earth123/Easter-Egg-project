import { BossPatternBase } from "./BossPatternBase";

export class WindAoe extends BossPatternBase {
    gridPattern(scene, caster){
        for(let i=200; i<1600; i+=200){
            for(let j=200; j<1200; j+=200){
                // 예고 이펙트
                const spacing = 16 * 3;   // path width: 15, wind scaling: 1.5 (여러 마리가 한 폭을 담당하므로 좀 더 크게)
                const maxDistance = 1600;

                const paths = [];
                for (let p=spacing; p<maxDistance; p+=spacing){
                    const imgv = scene.add.sprite(i, p, 'path');
                    const imgh = scene.add.sprite(p, j, 'path');
                    imgv.setOrigin(0, 0.5);
                    imgh.setOrigin(0, 0.5);
                    imgv.setScale(3);
                    imgh.setScale(3);
                    imgv.setRotation(Phaser.Math.DegToRad(90));
                    imgh.setRotation(0);
                    imgv.setTint(0xa30000);
                    imgh.setTint(0xa30000);
                    imgv.play('path');
                    imgh.play('path');

                    paths.push(imgv);
                    paths.push(imgh);
                }

                scene.time.delayedCall(500, () => {
                    // 예고 이펙트 삭제
                    paths.forEach(img => img.destroy());

                    // 10개의 바람 발사
                    for (let pass=0; pass<20; pass++){
                        // 연이어 가는 연출
                        scene.time.delayedCall(100 * pass, () => {
                            const bv = scene.pattern.create(i, 0, "windAoe");
                            const bh = scene.pattern.create(0, j, "windAoe");
                            bv.setOrigin(0.5);
                            bh.setOrigin(0.5);

                            const scale = this.base.scale ?? 1.0;
                            bv.setScale(scale);
                            bh.setScale(scale);

                            bv.play("windAoe");
                            bh.play("windAoe");
                                
                            const speed = this.base.speed ?? 500;
                            bv.setVelocity(0, speed * 1.875);
                            bh.setVelocity(speed * 2.5, 0);

                            bv.damage = this.getDamage();
                            bh.damage = this.getDamage();

                            scene.time.delayedCall(20000, () => {
                                if (bv && bv.active) bv.destroy();
                                if (bh && bh.active) bh.destroy();
                            });
                        })
                    }
                })
            }
        }

        scene.time.delayedCall(4000, () => {
            caster.isAttack = false;
            caster.isFrozen = false;
        })
    } 
    
    shootPattern(scene, caster){
        // 발사 시작 위치
        const sx = caster.x;
        const sy = caster.y;

        for(let i=0; i<4; i++){
            // 십자, 엑스자 2회 반복 (전환 1초)
            scene.time.delayedCall(i * 1000, () => {
                let startAngle = (i % 2) * 45;
                // 현재 방향을 기준으로 90도 각도로 시전
                for(let j=startAngle; j<360; j+=90){
                    const angle = Phaser.Math.DegToRad(j);
                    const dx = Math.cos(angle);
                    const dy = Math.sin(angle);

                    // 예고 이펙트
                    const spacing = 16 * 3;   // path width: 15, wind scaling: 1.5 (여러 마리가 한 폭을 담당하므로 좀 더 크게)
                    const maxDistance = 1600;

                    const paths = [];
                    for (let i=spacing; i<maxDistance; i+=spacing){
                        const x = sx + dx * i;
                        const y = sy + dy * i;

                        const img = scene.add.sprite(x, y, 'path');
                        img.setOrigin(0, 0.5);
                        img.setScale(3);
                        img.setRotation(angle);
                        img.setTint(0xa30000);
                        img.play('path');

                        paths.push(img);
                    }

                    scene.time.delayedCall(500, () => {
                        // 예고 이펙트 삭제
                        paths.forEach(img => img.destroy());

                        // 실 패턴 사용
                        // 10개의 바람 발사
                        for (let pass=0; pass<10; pass++){
                            // 연이어 가는 연출
                            scene.time.delayedCall(100 * pass, () => {
                                const b = scene.pattern.create(sx, sy, "windAoe");
                                b.setOrigin(0.5);

                                const scale = this.base.scale ?? 1.0;
                                b.setScale(scale);

                                b.play("windAoe");

                                // 방향에 맞춰 사진 뒤집기
                                if (dx < 0){
                                    b.flipX = true;
                                }
                                    
                                const speed = this.base.speed ?? 500;
                                b.setVelocity(dx * speed, dy * speed);

                                b.damage = this.getDamage();

                                scene.time.delayedCall(2000, () => {
                                    if (b && b.active) b.destroy();
                                });
                            })
                        }
                    })
                }
            })
        }

        scene.time.delayedCall(5500, () => {
            caster.isAttack = false;
            caster.isFrozen = false;
        })
    }

    cast(scene, caster) {
        const patternType = Phaser.Math.Between(0, 1);
        scene.time.delayedCall(600, () => {
            switch (patternType){
                case 0:
                    this.gridPattern(scene, caster);
                    break;
                case 1:
                    this.shootPattern(scene, caster);
                    break;
            }
        })
    }
}
