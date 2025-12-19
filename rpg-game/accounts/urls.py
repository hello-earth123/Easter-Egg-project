from django.urls import path
from .views import RegisterView, LoginView, VerifyEmailView, MeView, FirstSceneView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('me/', MeView.as_view()),
    path('first-scene/<int:user_id>/', FirstSceneView.as_view(), name='first-scene'),
]