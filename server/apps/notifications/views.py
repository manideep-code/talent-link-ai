from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        # Avoid executing user-dependent queries during schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()

        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return Notification.objects.none()

        return Notification.objects.filter(user=user).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        return Response({"detail": "Use event endpoints to create notifications."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.is_read:
            return Response({"status": "ok"})
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"})

    @action(detail=True, methods=["post"], url_path="toggle-star")
    def toggle_star(self, request, pk=None):
        notification = self.get_object()
        starred_value = request.data.get("starred")
        if starred_value is None:
            notification.is_starred = not notification.is_starred
        else:
            notification.is_starred = bool(starred_value)
        notification.save(update_fields=["is_starred"])
        return Response({"status": "ok", "is_starred": notification.is_starred})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})

    def destroy(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
