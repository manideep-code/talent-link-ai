from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FreelancerProfile, ClientProfile
from .serializers import FreelancerProfileSerializer, ClientProfileSerializer
from .permissions import IsOwnerOrReadOnly

class ClientProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Client Profiles.
    """
    queryset = ClientProfile.objects.all().order_by('-created_at')
    serializer_class = ClientProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            try:
                queryset = queryset.filter(user_id=int(user_id))
            except (TypeError, ValueError):
                return ClientProfile.objects.none()
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FreelancerProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Freelancer Profiles.
    """
    queryset = FreelancerProfile.objects.all().order_by('-created_at')
    serializer_class = FreelancerProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            try:
                queryset = queryset.filter(user_id=int(user_id))
            except (TypeError, ValueError):
                return FreelancerProfile.objects.none()
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def _select_profile_context(self, user, profile_type):
        def _client_profile():
            try:
                return user.client_profile
            except ClientProfile.DoesNotExist:
                return None

        def _freelancer_profile():
            return user.freelancer_profile.order_by('-created_at').first()

        if profile_type == 'client':
            return _client_profile(), ClientProfileSerializer, ClientProfile
        if profile_type == 'freelancer':
            return _freelancer_profile(), FreelancerProfileSerializer, FreelancerProfile
        if getattr(user, 'role', None) == 'client':
            return _client_profile(), ClientProfileSerializer, ClientProfile
        return _freelancer_profile(), FreelancerProfileSerializer, FreelancerProfile

    def _ensure_profile(self, profile, model_cls, user):
        if profile:
            return profile
        return model_cls.objects.create(user=user)

    @action(detail=False, methods=['get', 'post', 'put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Endpoint for the current user to view or edit their own profile.
        Query Params: ?profile_type=client or ?profile_type=freelancer
        """
        user = request.user
        profile_type = request.query_params.get('profile_type')
        profile, serializer_cls, model_cls = self._select_profile_context(user, profile_type)

        if request.method == 'GET':
            profile = self._ensure_profile(profile, model_cls, user)
            serializer = serializer_cls(profile, context={'request': request})
            return Response(serializer.data)

        if request.method == 'POST':
            status_code = status.HTTP_201_CREATED
            if profile:
                serializer = serializer_cls(profile, data=request.data, context={'request': request})
                status_code = status.HTTP_200_OK
                save_kwargs = {}
            else:
                serializer = serializer_cls(data=request.data, context={'request': request})
                save_kwargs = {'user': user}
            serializer.is_valid(raise_exception=True)
            serializer.save(**save_kwargs)
            return Response(serializer.data, status=status_code)

        if request.method in ['PUT', 'PATCH']:
            profile = self._ensure_profile(profile, model_cls, user)
            serializer = serializer_cls(
                profile,
                data=request.data,
                partial=(request.method == 'PATCH'),
                context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)