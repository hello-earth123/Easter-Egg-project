from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes

from .models import Monster
from .serializers import MonsterSerializer, MonsterCallSerializer

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

    # 몬스터 검색 및 전송을 위한 직렬화
    monster = Monster.objects.filter(name__in=names)
    serializer = MonsterSerializer(monster, many=True)

    return Response(serializer.data)
