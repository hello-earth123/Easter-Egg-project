// skills/MeteorS.js
import { FireSkillBase } from "./FireSkillBase.js";

export class MeteorS extends FireSkillBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    // 좌우만 판단 (위/아래를 보고 있어도 좌우 기준으로 처리)
    const facingX = dir.x >= 0 ? 1 : -1;   // 오른쪽: 1, 왼쪽: -1

    // 메테오가 떨어지는 중심 지점 (캐릭터 전방)
    const baseDist = this.base.distance ?? 180;
    const centerX = caster.x + facingX * baseDist;
    const centerY = caster.y;

    const count = this.base.count ?? 2;       // Config에 있으면 그 값 사용
    const radius = this.base.radius ?? 60;    // 폭발 범위
    const spread = this.base.spread ?? 45;    // 산개 간격 (세로 방향으로 퍼짐)
    const fallDuration = this.base.fallDuration ?? 330; // 떨어지는 시간
    const interval = this.base.interval ?? 140;         // 메테오 사이 간격

    for (let i = 0; i < count; i++) {
      // 가운데 기준으로 위/아래로 퍼지도록 index 계산
      const idx = i - (count - 1) / 2;
      const offsetY = idx * spread;

      // 개별 메테오 착지 지점
      const landX = centerX;
      const landY = centerY + offsetY;

      // 스폰 지점: 캐릭터보다 '뒤쪽 + 위쪽'
      // 오른쪽 보면 좌상단, 왼쪽 보면 우상단에서 떨어짐
      const spawnX = landX - facingX * 200;
      const spawnY = landY - 220;

      scene.time.delayedCall(i * interval, () => {
        const meteor = scene.add.sprite(spawnX, spawnY, "meteor_L");
        if (facingX === -1) meteor.flipX = true;   // ← 추가
        meteor.play("meteor_L");

        scene.tweens.add({
          targets: meteor,
          x: landX,
          y: landY,
          duration: fallDuration,
          onComplete: () => {
            meteor.destroy();

            // 폭발 범위 내 몬스터에게만 데미지 + 맞으면 카메라 흔들림
            scene.damageArea({
              x: landX,
              y: landY,
              radius,
              dmg: this.getDamage(),
              onHit: () => this.shakeCameraOnHit(scene),
            });
          },
        });
      });
    }

    scene.textBar = `Meteor S (Lv${this.level})`;
  }
}
