from rest_framework import viewsets
from .models import Character
from .serializers import CharacterSerializer
from rest_framework.permissions import IsAuthenticated

class CharacterViewSet(viewsets.ModelViewSet):
    queryset = Character.objects.all()
    serializer_class = CharacterSerializer
    permission_classes = [IsAuthenticated]
