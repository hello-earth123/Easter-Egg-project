// utils/SkillVFX.js
export function applyVFX(scene, sprite, vfxType) {
  if (!sprite || !vfxType) return;

  // 모든 스킬 기본적으로 alpha = 1 유지 (흐릿함 방지)
  sprite.setAlpha(1);

  switch (vfxType) {

    // 작은 탄, 빠른 발사체 (fireball)
    case "trail_fast":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF9A00); // 더 진한 불꽃 색감
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.98, to: sprite.scale * 1.02 }, // 흐릿해지지 않도록 범위 축소
        duration: 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      break;

    // 버프 오라 (플레이어 주변)
    case "buff_aura":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xE70909);  // 청색 강화
      // alpha tween 제거 → 흐릿해지는 원인 제거
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.97, to: sprite.scale * 1.03 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
      break;

    // Flame A/B/C – 숨쉬는 불꽃
    case "flame_pulse":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF7A00); 
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.97, to: sprite.scale * 1.03 },
        duration: 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      break;

    // 큰 폭발 (firebomb, 작은 메테오 착지 등)
    case "explosion_big":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFFAA33);
      // alpha 감소는 폭발 특성상 자연스러우므로 유지
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.7, to: sprite.scale * 1.7 },
        alpha: { from: 1, to: 0.9 },
        duration: 320,
        ease: "Cubic.Out",
      });
      break;

    // 화염 방사기 – 좌우로 약간 출렁이는 불길
    case "cone_flame":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF7A00);
      scene.tweens.add({
        targets: sprite,
        angle: { from: -3, to: 3 },
        duration: 130,
        yoyo: true,
        repeat: -1,
      });
      break;

    // Meteor S/M
    case "meteor_small":
    case "meteor_medium":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF8800);
      scene.tweens.add({
        targets: sprite,
        angle: { from: -5, to: 5 },
        duration: 120,
        yoyo: true,
        repeat: -1,
      });
      break;

    // Meteor L – 더 강력한 색감 강조
    case "meteor_large":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF6600);
      scene.tweens.add({
        targets: sprite,
        angle: { from: -6, to: 6 },
        duration: 120,
        yoyo: true,
        repeat: -1,
      });
      break;

    // Napalm 첫 폭발
    case "napalm_burst":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFF7700);
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.95, to: sprite.scale * 1.2 }, // 기존보다 과한 확대 제거
        duration: 200,
        ease: "Back.Out",
      });
      break;

    // Napalm 장판 – 바닥 불길
    case "flame_floor":
      sprite.setBlendMode(Phaser.BlendModes.MULTIPLY);
      sprite.setTint(0xFF5500);
      scene.tweens.add({
        targets: sprite,
        scale: { from: sprite.scale * 0.98, to: sprite.scale * 1.04 },
        duration: 260,
        yoyo: true,
        repeat: -1,
      });
      break;

    // Death Hand
    case "deathhand_impact":
      sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      sprite.setTint(0xFFFFFF);
      scene.tweens.add({
        targets: sprite,
        scale: sprite.scale * 1.1,
        duration: 200,
        ease: "Back.Out",
      });
      scene.cameras.main.shake(200, 0.01);
      break;

    default:
      break;
  }
}
