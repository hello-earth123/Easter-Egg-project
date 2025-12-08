import { BossPatternBase } from "./BossPatternBase";

export class Thunder extends BossPatternBase {
  cast(scene, caster) {
    const dir = this.getDir(caster);

    // 발사 시작 위치
    const sx = caster.x + dir.x * 20;
    const sy = caster.y + dir.y * 20;

    // === 🔥 Fireball 생성 ===
    const b = scene.bullets.create(sx, sy, "fireball");
    b.setOrigin(0.5);

    // === 🔥 Config scale 적용 ===
    const scale = this.base.scale ?? 1.0;
    b.setScale(scale);

    // === 🔥 VFX 적용 ===
    applyVFX(scene, b, this.base.vfx);

    // === 🔥 애니메이션 재생 ===
    b.play("fireball");

    // === 🔥 sprite 회전 (캐릭터 바라보는 방향) ===
    // dir.x, dir.y 기반으로 자동 회전
    b.rotation = Math.atan2(dir.y, dir.x);

    // === 🔥 이동 속도 ===
    const speed = this.base.speed ?? 500;
    b.setVelocity(dir.x * speed, dir.y * speed);

    // === 🔥 충돌 데미지 ===
    b.damage = this.getDamage();

    // === 🔥 카메라 흔들림 콜백 유지 ===
    b.onHit = () => this.shakeCameraOnHit(scene);

    // === 🔥 자동 제거 ===
    scene.time.delayedCall(1500, () => {
      if (b && b.active) b.destroy();
    });

    scene.textBar = `Fireball (Lv${this.level})`;
  }
}
