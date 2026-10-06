from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

# 1. IMPORT AllowAny
from rest_framework.permissions import AllowAny 

from .serializers import (
    RegisterSerializer, 
    VerifyOTPSerializer, 
    CustomTokenObtainPairSerializer
)

User = get_user_model()

# --- Register View ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    # 2. ADD THIS LINE: Allow anyone to register
    permission_classes = [AllowAny]

# --- Login View ---
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    # Login is usually public by default, but you can add this to be safe
    permission_classes = [AllowAny]

# --- Verify OTP View ---
class VerifyOTPView(generics.GenericAPIView):
    serializer_class = VerifyOTPSerializer
    # 3. ADD THIS LINE: Allow anyone to verify OTP (they aren't logged in yet)
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            try:
                user = User.objects.get(email=email)
                if user.otp == otp:
                    user.is_active = True
                    user.otp = None 
                    user.save()
                    return Response({"message": "Account verified!"}, status=status.HTTP_200_OK)
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)