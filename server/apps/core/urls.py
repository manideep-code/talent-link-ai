# File: apps/core/urls.py

from django.urls import path
from .views import (
    RegisterView, 
    VerifyOTPView, 
    CustomTokenObtainPairView
)

urlpatterns = [
    # Endpoint: /api/register/
    path('register/', RegisterView.as_view(), name='register'),

    # Endpoint: /api/login/
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),

    # Endpoint: /api/verify-otp/
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
]