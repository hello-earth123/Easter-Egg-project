from django.urls import path
from . import views

urlpatterns = [
    path("monsters/", views.emptyMonster),
    path("player/<int:userId>/", views.playerConnect),
    path("inventory/<int:userId>/", views.invenConnect),
    path("slot/<int:userId>/", views.slotConnect),
    path("item/<str:name>/", views.eachItem),
    path("nowLocation/<int:userId>/", views.nowLocation),
    path('save_game/<int:userId>/', views.save),
]
