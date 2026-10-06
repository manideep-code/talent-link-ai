




from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
import datetime
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from apps.core.models import SiteSetting

# Import serializers
from .serializers import (
    RegisterSerializer, VerifyOTPSerializer, 
    ForgotPasswordSerializer, ResetPasswordSerializer,
    CustomTokenObtainPairSerializer
)
from apps.core.utils import generate_otp, send_otp_email

User = get_user_model()


def _get_google_client_id() -> str:
    stored = (
        SiteSetting.objects.filter(key='google_client_id')
        .values_list('value', flat=True)
        .first()
    )
    if stored:
        return stored.strip()
    return getattr(settings, 'GOOGLE_CLIENT_ID', '').strip()

# --- 1. Custom Login View ---
class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# --- 2. Registration ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    authentication_classes = []  # Added to ensure registration is always public
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class GoogleAuthView(views.APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)

    def post(self, request):
        id_token = request.data.get('id_token')
        requested_role = request.data.get('role')

        if not id_token:
            return Response({'detail': 'Missing id_token'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = _get_google_client_id()
        if not client_id:
            return Response({'detail': 'Google authentication is not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            token_info = google_id_token.verify_oauth2_token(id_token, google_requests.Request(), client_id)
        except ValueError:
            return Response({'detail': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = token_info.get('email')
        if not email:
            return Response({'detail': 'Google token does not include an email address'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = token_info.get('given_name', '') or ''
        last_name = token_info.get('family_name', '') or ''
        picture = token_info.get('picture')

        valid_roles = {choice[0] for choice in User.ROLE_CHOICES}
        normalized_role = requested_role.lower() if isinstance(requested_role, str) else None
        desired_role = normalized_role if normalized_role in valid_roles else None

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'role': desired_role or 'freelancer',
                'is_active': True,
                'is_verified': True,
            }
        )

        user_changed = False

        if created:
            user.set_unusable_password()
            user_changed = True
        else:
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                user_changed = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                user_changed = True
            if desired_role and user.role != desired_role:
                user.role = desired_role
                user_changed = True
            if not user.is_active:
                user.is_active = True
                user_changed = True
            if not user.is_verified:
                user.is_verified = True
                user_changed = True

        if user_changed:
            user.save()

        refresh = RefreshToken.for_user(user)
        full_name = f"{user.first_name or ''} {user.last_name or ''}".strip()

        response_payload = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'email': user.email,
            'role': user.role,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'name': full_name or user.email,
        }

        if picture:
            response_payload['avatar'] = picture

        return Response(response_payload, status=status.HTTP_200_OK)


class GoogleConfigView(views.APIView):
    authentication_classes = []
    permission_classes = (AllowAny,)

    def get(self, request):
        client_id = _get_google_client_id()
        return Response({'client_id': client_id}, status=status.HTTP_200_OK)

    def post(self, request):
        client_id = (request.data.get('client_id') or '').strip()
        if not client_id:
            return Response({'detail': 'client_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        SiteSetting.objects.update_or_create(
            key='google_client_id',
            defaults={'value': client_id},
        )

        return Response({'client_id': client_id}, status=status.HTTP_200_OK)

# --- 3. OTP Verification ---
class VerifyOTPView(views.APIView):
    authentication_classes = [] # Explicitly disable auth to prevent 401 checks
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            
            try:
                user = User.objects.get(email=email)
                
                # Check if OTP is expired (10 minutes)
                if user.otp_created_at and (timezone.now() - user.otp_created_at) > datetime.timedelta(minutes=10):
                    return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
                
                if user.otp == otp:
                    user.is_active = True
                    user.is_verified = True
                    user.otp = None 
                    user.save()
                    return Response({"message": "Verified successfully."}, status=status.HTTP_200_OK)
                
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- 4. Forgot Password ---
class ForgotPasswordView(views.APIView):
    authentication_classes = [] # Added: Essential for public access
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                otp = generate_otp()
                user.otp = otp
                user.otp_created_at = timezone.now()
                user.save()
                send_otp_email(email, otp)
                return Response({"message": "OTP sent."}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Security best practice to prevent email enumeration
                return Response({"message": "OTP sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- 5. Reset Password ---
class ResetPasswordView(views.APIView):
    authentication_classes = [] # Added: Essential for public access
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp = serializer.validated_data['otp']
            new_password = serializer.validated_data['new_password']
            try:
                user = User.objects.get(email=email)
                
                # Added: Check if OTP is expired (Same logic as VerifyOTP)
                if user.otp_created_at and (timezone.now() - user.otp_created_at) > datetime.timedelta(minutes=10):
                    return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)

                if user.otp == otp:
                    user.set_password(new_password)
                    user.otp = None
                    user.save()
                    return Response({"message": "Password reset."}, status=status.HTTP_200_OK)
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- 6. Profile (simple current-user details) ---
class ProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            "id": user.id,
            "email": getattr(user, "email", ""),
            "username": getattr(user, "username", ""),
            "first_name": getattr(user, "first_name", ""),
            "last_name": getattr(user, "last_name", ""),
            "role": getattr(user, "role", ""),
        }
        return Response(data, status=status.HTTP_200_OK)


class UserSearchView(views.APIView):
    """Authenticated endpoint to search users by email or name.

    Query params:
    - q: search string (email or name)

    Returns a list of up to 10 users with minimal fields.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response([], status=status.HTTP_200_OK)

        try:
            users = User.objects.filter(
                Q(email__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q)
            ).order_by('email')[:10]
        except Exception as exc:
            # In case the User model does not have expected fields or other DB errors,
            # avoid raising a 500 and return an empty result set for the autocomplete.
            users = []

        data = []
        for u in users:
            first = getattr(u, 'first_name') or ''
            last = getattr(u, 'last_name') or ''
            data.append({
                'id': u.id,
                'email': getattr(u, 'email', '') or '',
                'first_name': first,
                'last_name': last,
                'full_name': (first + ' ' + last).strip()
            })

        return Response(data, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"error": "Invalid or expired refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "Logged out successfully."}, status=status.HTTP_205_RESET_CONTENT)