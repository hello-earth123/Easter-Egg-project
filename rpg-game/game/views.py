from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Monster
from .serializers import MonsterSerializer

# class CharacterViewSet(viewsets.ModelViewSet):
#     queryset = Character.objects.all()
#     serializer_class = CharacterSerializer
#     permission_classes = [IsAuthenticated]

@api_view(['GET'])
def emptyMonster(request, name):
    monster = Monster.objects.get(name=name)
    serializer = MonsterSerializer(monster)

    return Response(serializer.data)