from django.db import models
from django.contrib.auth.models import User
# from django.db.models import JSONField

from django.core.validators import MinValueValidator, MaxValueValidator


# class Character(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     nickname = models.CharField(max_length=50)
#     location = models.CharField(max_length=100, default='village')
#     level = models.IntegerField(default=1)
#     exp = models.IntegerField(default=0)
#     hp = models.IntegerField(default=100)
#     mp = models.IntegerField(default=50)
#     status = JSONField(default=dict)  # strength, dex, etc.
#     skills = JSONField(default=list)
#     inventory = JSONField(default=dict)  # money, item dict

#     def __str__(self):
#         return self.nickname

class Item(models.Model):
    ITEM_TYPES = [
        ('consume', 'Consume'),
        ('misc', 'Misc'),
    ]

    name = models.CharField(primary_key=True)
    itemType = models.CharField(max_length=20, choices=ITEM_TYPES, default='misc')
    hpEffect = models.IntegerField(default=0)
    mpEffect = models.IntegerField(default=0)


class Monster(models.Model):
    # primary key 설정을 통해 unique 설정을 키고 id field 생성을 방지
    name = models.CharField(primary_key=True)
    baseHP = models.FloatField()
    growthHP = models.FloatField()
    baseAtk = models.FloatField()
    growthAtk = models.FloatField()
    baseExp = models.IntegerField()
    growthExp = models.FloatField()


class Droptable(models.Model):
    itemName = models.ForeignKey(Item, on_delete=models.CASCADE)
    monsterName = models.ForeignKey(Monster, on_delete=models.CASCADE, related_name='drop')
    # 드랍 확률 : 0 ~ 1
    chance = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )