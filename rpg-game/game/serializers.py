from rest_framework import serializers
from .models import Item, Monster, Droptable

# class CharacterSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Character
#         fields = '__all__'

class ItemSerializer(serializers.Serializer):
    class Meta:
        model = Item
        fields = '__all__'

class MonsterSerializer(serializers.Serializer):
    class Meta:
        model = Monster
        fields = '__all__'

class DroptableSerializer(serializers.Serializer):
    class Meta:
        model = Droptable
        fields = '__all__'