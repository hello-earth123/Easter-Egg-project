from django.contrib.auth import authenticate
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None:
        return Response({"success": True, "userId": user.id, "username": user.username})
    else:
        return Response({"success": False, "message": "Invalid username or password"})
