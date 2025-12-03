from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from django.contrib.auth import get_user_model
from .models import Monster, player, Item, Inventory, Slot, SkillLevel
from .serializers import (
    MonsterSerializer,
    MonsterCallSerializer,
    PlayerSerializer,
    ItemSerializer,
    InventorySerializer,
    SlotSerializer,
    NowLocationSerializer,
    SkillSerializer,
)

# class CharacterViewSet(viewsets.ModelViewSet):
#     queryset = Character.objects.all()
#     serializer_class = CharacterSerializer
#     permission_classes = [IsAuthenticated]


@api_view(["POST"])
@permission_classes([AllowAny])
def emptyMonster(request):
    # scene에 바인딩 된 몬스터 이름 직렬화
    serializer = MonsterCallSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    names = serializer.validated_data["names"]

    monsters = Monster.objects.filter(name__in=names)

    # 몬스터 검색 및 전송을 위한 직렬화
    serializer = MonsterSerializer(monsters, many=True)

    return Response(serializer.data)


@api_view(["GET"])
def playerConnect(request, userId):
    # 이후 정상적인 로그인 작성 시 사용
    # user = request.user

    User = get_user_model()
    user = User.objects.get(pk=userId)
    account = player.objects.get(user=user)

    serializer = PlayerSerializer(account)

    return Response(serializer.data)


@api_view(["GET"])
def invenConnect(request, userId):
    User = get_user_model()
    user = User.objects.get(pk=userId)
    inventory = Inventory.objects.get(user=user)

    serializer = InventorySerializer(inventory)

    return Response(serializer.data)


@api_view(["GET"])
def slotConnect(request, userId):
    User = get_user_model()
    user = User.objects.get(pk=userId)
    slot = Slot.objects.get(user=user)

    serializer = SlotSerializer(slot)

    return Response(serializer.data)


@api_view(["GET"])
def eachItem(request, name):
    item = Item.objects.get(name=name)
    serializer = ItemSerializer(item)

    return Response(serializer.data)


@api_view(["GET"])
def nowLocation(request, userId):
    User = get_user_model()
    user = User.objects.get(pk=userId)
    location = player.objects.get(user=user)

    serializer = NowLocationSerializer(location)

    return Response(serializer.data)


@api_view(['PUT'])
def save(request, userId):
    data = request.data

    User = get_user_model()
    user = User.objects.get(pk=userId)

    account = player.objects.get(user=user)
    stats = data.get('stats', {})

    account.level = stats.get('level', account.level)
    account.exp = stats.get('exp', account.exp)

    account.maxHP = stats.get('maxHp', account.maxHP)
    account.currentHP = stats.get('hp', account.currentHP)
    account.maxMP = stats.get('maxMp', account.maxMP)
    account.currentMP = stats.get('mp', account.currentMP)
    
    account.staffDamage = stats.get('damage', account.staffDamage)
    account.staffCoolReduce = stats.get('cooldown', account.staffCoolReduce)
    account.staffManaReduce = stats.get('manaCost', account.staffManaReduce)
    account.staffDefense = stats.get('defense', account.staffDefense)
    account.staffLuk = stats.get('luck', account.staffLuk)
    account.point = stats.get('point', account.point)

    account.damageGem = stats.get('damageGem', account.damageGem)
    account.coolReduceGem = stats.get('cooldownGem', account.coolReduceGem)
    account.manaReduceGem = stats.get('manaCostGem', account.manaReduceGem)
    account.defenseGem = stats.get('defenseGem', account.defenseGem)
    account.lukGem = stats.get('luckGem', account.lukGem)

    account.nowLocation = data.get('scene', account.nowLocation)
    account.save()

    inventory = Inventory.objects.get(user=user)

    inventory.invenItem = data.get('inventory', {}).get('inventory').get('items', inventory.invenItem)
    inventory.save()

    slot = Slot.objects.get(user=user)
    slot.skillSlots = data.get('slots', {}).get('skillSlots', slot.skillSlots)
    print(slot.skillSlots)
    slot.itemSlots = data.get('slots', {}).get('itemSlots', slot.itemSlots)
    slot.save()

    skill = SkillLevel.objects.get(user=user)
    skill.skillLev = data.get('skill', skill.skillLev)
    skill.save()

    return Response({'status': 'saved'})


@api_view(['GET'])
def skillLev(request, userId):
    User = get_user_model()
    user = User.objects.get(pk=userId)
    skillLevel = SkillLevel.objects.get(user=user)

    serializer = SkillSerializer(skillLevel)

    return Response(serializer.data)
