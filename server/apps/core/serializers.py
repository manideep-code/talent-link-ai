from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.utils import generate_otp, send_otp_email
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Get User Model
User = get_user_model()

# --- 1. Custom Login Serializer ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Generate standard tokens
        data = super().validate(attrs)
        
        # Add custom fields to response
        data['role'] = self.user.role
        data['email'] = self.user.email
        data['name'] = self.user.first_name
        return data
    class Meta:
        # Unique ref_name for schema generation
        ref_name = "CoreTokenObtainPairSerializer"

# --- 2. Registration Serializer ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    # We allow role to be optional (defaults to freelancer in create method)
    # to prevent errors if frontend sends it incorrectly.

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role']

        # Unique ref_name to avoid drf-yasg collisions
        ref_name = "CoreRegisterSerializer"

    def create(self, validated_data):
        # Default to 'freelancer' if not provided
        role = validated_data.get('role', 'freelancer')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            is_active=False 
        )
        
        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        send_otp_email(user.email, otp)
        return user

# --- 3. Other Serializers ---
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)