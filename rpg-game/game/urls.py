from django.urls import path
from . import views

urlpatterns = [
    path('monsters/<str:name>/', views.emptyMonster),
]