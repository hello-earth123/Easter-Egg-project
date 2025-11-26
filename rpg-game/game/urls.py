from django.urls import path
from . import views

urlpatterns = [
    path("monsters/", views.emptyMonster),
    path("player/<int:userId>/", views.playerConnect),
    path("item/<str:name>/", views.eachItem),
]
