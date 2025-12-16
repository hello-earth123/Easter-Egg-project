import { BossPatternBase } from "./BossPatternBase";

export class ReflectVoid extends BossPatternBase {
  cast(scene, caster) {
    caster.doReflect = true;
    scene.time.delayedCall(500, () => {
      caster.isFrozen = false;
      caster.isAttack = false;
    })

    const reflect = scene.add.sprite(caster.x, caster.y - 20, 'void');
    reflect.setOrigin(0.5);

    const scale = this.base.scale ?? 1;
    reflect.setScale(scale);
    reflect.play('void');

    reflect.update = () => {
      reflect.x = caster.x;
      reflect.y = caster.y - 20;
    }
    scene.events.on('update', reflect.update, reflect);

    scene.time.delayedCall(5000, () => {
      caster.doReflect = false;
      if (reflect && reflect.active) reflect.destroy();
    })
  }
}
