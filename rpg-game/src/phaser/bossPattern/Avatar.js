import { BossPatternBase } from "./BossPatternBase";

function attacked(){
    const caster = this.caster;
    const scene = this.scene;

    if (this.real){
        caster.setVisible(true);
        caster.body.enable = true;

        const boss = [...scene.boss.getChildren()];
        boss.forEach((b) => {
            if (!b) return
            
            if (b.isAvatar){
                b.destroy();
            }
        })

        caster.setVisible(true);
        caster.body.enable = true;

        scene.time.delayedCall(3000, () => {
            caster.isAttack = false;
            caster.isFrozen = false;
        })
    }
    else{
        caster.hp += (caster.maxHp * 0.2);
    }

    this.destroy();
}

export class Avatar extends BossPatternBase {
    cast(scene, caster) {
        caster.setVisible(false);   // 이름표만 출력
        caster.body.enable = false;
        caster.isAttack = true;
        caster.isFrozen = true;

        const delta = [[200, 608], [1400, 608], [800, 152], [800, 1064]];
        const real = Phaser.Math.Between(0, 3);

        for (const [i, [x, y]] of delta.entries()){
            const avatar = scene.boss.create(x, y, 'vampire');
            avatar.setScale(5);
            avatar.caster = caster;
            avatar.isAvatar = true;
            avatar.isFrozen = true;
            avatar.hp = 1;
            avatar.real = (i === real);
            avatar.attacked = attacked;

            if (i != real){
                const bat = scene.add.sprite(x + 50, y - 50, 'batswarm');
                bat.setOrigin(0.5);
                bat.setScale(1);
                bat.play('batswarm');

                // bat 초기화 - GPT 최고
                bat._t = 0;
                bat._lastTime = performance.now();

                bat._amplitudeX = 50; // 좌우 이동 폭
                bat._speed = 0.005;   // 이동 속도

                bat._originX = x;     // 기준 x
                bat._originY = y - 50; // 기준 y (상단 고정)

                bat.update = () => {
                    const now = performance.now();
                    const delta = now - bat._lastTime;
                    bat._lastTime = now;

                    bat._t += delta * bat._speed;

                    // 좌우 왕복
                    const offsetX = Math.sin(bat._t) * bat._amplitudeX;
                    bat.x = bat._originX + offsetX;
                    bat.y = bat._originY;

                    // 좌우 flip
                    bat.flipX = offsetX > 0; // 좌측 이동 시 뒤집기
                };

                scene.events.on('update', bat.update, bat);

                scene.time.delayedCall(5000, () => {
                    if (bat && bat.active) bat.destroy();
                })
            }
        }
    }
}
