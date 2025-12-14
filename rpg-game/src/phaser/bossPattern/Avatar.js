import { BossPatternBase } from "./BossPatternBase";

export class Avatar extends BossPatternBase {
    cast(scene, caster) {
        caster.isAttack = true;

        const delta = [[200, 608], [1400, 608], [800, 152], [800, 1064]];
        const real = Phaser.Math.Between(0, 4);
        
        // 본체는 임시 정지 (active false)
        // caster.x = delta[real][0];
        // caster.y = delta[real][1];
        // caster.isFrozen = true;

        // 복제 3곳
        // 복제 공격 시, cater.hp += (caster.maxHp * 0.2); caster.isAttack = false; 패턴 종료;
        // 본체 공격 시, caster.isAttack = false; 패턴 종료;
        // 복제 소환으로 cast는 끝나고 각 기능을 복제/본체에 달아주는게 낫겠다
        // avatar 그룹을 만들어주고 객체 생성할 때 복제/본체 판별 속성 추가한 뒤 그거에 맞춰서 collider 콜백 함수 동작
    }
}
