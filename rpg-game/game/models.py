from django.db import models
from django.conf import settings

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
    name = models.CharField(primary_key=True)
    effect = models.FloatField(default=0)


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
    monsterName = models.ForeignKey(
        Monster, on_delete=models.CASCADE, related_name="drop"
    )
    # 드랍 확률 : 0 ~ 1
    chance = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)]
    )


class player(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="player"
    )
    name = models.CharField(max_length=15)

    level = models.IntegerField(default=1)
    exp = models.FloatField(default=0)

    maxHP = models.IntegerField(default=10)
    currentHP = models.IntegerField(default=10)
    maxMP = models.IntegerField(default=10)
    currentMP = models.IntegerField(default=10)

    staffDamage = models.FloatField(default=0)
    staffCoolReduce = models.FloatField(default=0)
    staffManaReduce = models.FloatField(default=0)
    staffDefense = models.FloatField(default=0)
    staffLuk = models.FloatField(default=0)
    point = models.IntegerField(default=0)

    lowGemCount = models.IntegerField(default=0)
    midGemCount = models.IntegerField(default=0)
    highGemCount = models.IntegerField(default=0)
    superGemCount = models.IntegerField(default=0)

    nowLocation = models.CharField(default="mainScene")


class Inventory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="playerInven"
    )
    invenItem = models.JSONField(default=list)


class Slot(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="slot"
    )
    skillSlots = models.JSONField(default=list)
    itemSlots = models.JSONField(default=list)
