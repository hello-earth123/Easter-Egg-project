from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField

class Character(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=50)
    location = models.CharField(max_length=100, default='village')
    level = models.IntegerField(default=1)
    exp = models.IntegerField(default=0)
    hp = models.IntegerField(default=100)
    mp = models.IntegerField(default=50)
    status = JSONField(default=dict)  # strength, dex, etc.
    skills = JSONField(default=list)
    inventory = JSONField(default=dict)  # money, item dict

    def __str__(self):
        return self.nickname
