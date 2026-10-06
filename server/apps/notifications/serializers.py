from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "verb",
            "title",
            "body",
            "target_type",
            "target_id",
            "metadata",
            "is_read",
            "is_starred",
            "created_at",
            "actor_name",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        actor = obj.actor
        if not actor:
            return None
        full_name = f"{actor.first_name} {actor.last_name}".strip()
        return full_name or actor.email
