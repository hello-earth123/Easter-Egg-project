from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .serializers import RegisterSerializer, LoginSerializer
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.shortcuts import redirect
from django.http import HttpResponse
from .models import CustomUser
from game.models import player, Inventory, Slot, SkillLevel

# 이메일 인증 토큰 저장용 (간단한 예시)
email_tokens = {}

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Player 및 관련 모델 생성
            player.objects.create(user=user, name=user.username)
            Inventory.objects.create(user=user)
            Slot.objects.create(user=user)
            SkillLevel.objects.create(user=user)

            # 이메일 인증 링크 생성
            token = get_random_string(32)
            email_tokens[token] = user.pk
            verification_link = f"http://localhost:8000/api/accounts/verify-email/{token}/"

            # Gmail로 전송
            send_mail(
                '회원가입 이메일 인증',
                f'링크를 클릭하여 인증하세요: {verification_link}',
                'noreply@example.com',
                [user.email],
            )

            return Response({"detail": "회원가입 완료. 이메일을 확인하세요."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    def get(self, request, token):
        user_pk = email_tokens.get(token)
        if not user_pk:
            return HttpResponse("유효하지 않은 인증 링크", status=400)

        user = CustomUser.objects.get(pk=user_pk)
        user.is_active = True
        user.save()

        # 인증 완료 후 Vue 로그인 화면으로 리다이렉트
        return redirect("http://localhost:8000/login")


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            return Response({"user_id": user.pk}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
