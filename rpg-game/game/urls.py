from django.urls import path
from . import views

urlpatterns = [
    path("monsters/", views.emptyMonster),
]
