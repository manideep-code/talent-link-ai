from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.proposals.models import ProjectProposal
from .models import Conversation, Message

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "name", "email", "username"]

    def get_name(self, obj):
        full_name = (obj.get_full_name() or "").strip()
        if full_name:
            return full_name
        if obj.username:
            return obj.username
        return obj.email


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.EmailField(source="sender.email", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_name",
            "sender_email",
            "text",
            "created_at",
            "is_read",
        ]
        read_only_fields = fields

    def get_sender_name(self, obj):
        full_name = (obj.sender.get_full_name() or "").strip()
        if full_name:
            return full_name
        if obj.sender.username:
            return obj.sender.username
        return obj.sender.email


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["text"]


class ProposalSummarySerializer(serializers.ModelSerializer):
    client = UserSummarySerializer(read_only=True)
    freelancer = UserSummarySerializer(read_only=True)

    class Meta:
        model = ProjectProposal
        fields = [
            "id",
            "status",
            "bid_amount",
            "completion_time",
            "project_id",
            "client",
            "freelancer",
            "created_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    proposal_details = ProposalSummarySerializer(source="proposal", read_only=True)
    participants_detail = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "proposal",
            "proposal_details",
            "participants",
            "participants_detail",
            "last_message",
            "created_at",
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return MessageSerializer(msg).data
        return None

    def get_participants_detail(self, obj):
        participants = obj.participants.all()
        return UserSummarySerializer(participants, many=True).data
