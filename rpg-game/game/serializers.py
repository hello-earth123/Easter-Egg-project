from rest_framework import serializers
from .models import Item, Monster, Droptable, player

# class CharacterSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Character
#         fields = '__all__'


class DroptableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Droptable
        fields = "__all__"


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = "__all__"


class MonsterSerializer(serializers.ModelSerializer):
    drop = DroptableSerializer(many=True, read_only=True)

    class Meta:
        model = Monster
        fields = "__all__"


class MonsterCallSerializer(serializers.Serializer):
    names = serializers.ListField(child=serializers.CharField(), allow_empty=True)


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = player
        fields = "__all__"
