from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from django.contrib.auth import get_user_model
from .models import Monster, player, Item, Inventory, Slot
from .serializers import (
    MonsterSerializer,
    MonsterCallSerializer,
    PlayerSerializer,
    ItemSerializer,
    InventorySerializer,
    SlotSerializer,
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
    print(serializer.data)

    return Response(serializer.data)


@api_view(["GET"])
def eachItem(request, name):
    item = Item.objects.get(name=name)
    serializer = ItemSerializer(item)

    print(serializer.data)

    return Response(serializer.data)
