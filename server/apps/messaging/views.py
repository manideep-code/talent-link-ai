from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.proposals.models import ProjectProposal
from .models import Conversation, Message
from .permissions import CanSendMessage
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)

class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Avoid executing user-dependent queries during schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Conversation.objects.none()

        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return Conversation.objects.none()

        return (
            Conversation.objects
            .filter(participants=user)
            .select_related("proposal")
            .prefetch_related("participants", "messages")
            .order_by("-created_at")
        )

class MessageListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, CanSendMessage]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MessageCreateSerializer
        return MessageSerializer

    def get_queryset(self):
        conversation = get_object_or_404(
            Conversation, id=self.kwargs["conversation_id"]
        )
        self.check_object_permissions(self.request, conversation)
        return conversation.messages.select_related("sender").all()

    def create(self, request, *args, **kwargs):
        conversation = get_object_or_404(
            Conversation, id=self.kwargs["conversation_id"]
        )
        self.check_object_permissions(request, conversation)

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=serializer.validated_data["text"],
        )

        # Notify all other participants about the new message
        try:
            from apps.notifications.models import create_notification_bulk

            recipients = conversation.participants.exclude(id=request.user.id)
            create_notification_bulk(
                users=recipients,
                verb="message_received",
                title="New message",
                body=message.text[:120],
                actor=request.user,
                target_type="conversation",
                target_id=conversation.id,
                metadata={"conversation_id": conversation.id, "proposal_id": conversation.proposal_id},
            )
        except Exception:
            pass

        output = MessageSerializer(message)
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class ConversationEnsureView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        proposal_id = request.data.get("proposal_id")
        if not proposal_id:
            return Response(
                {"detail": "proposal_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposal = get_object_or_404(ProjectProposal, id=proposal_id)
        user = request.user
        participants = [p for p in [proposal.client, proposal.freelancer] if p]

        if user not in participants:
            return Response(
                {"detail": "You do not have access to this proposal."},
                status=status.HTTP_403_FORBIDDEN,
            )

        conversation, created = Conversation.objects.get_or_create(
            proposal=proposal
        )

        if participants:
            conversation.participants.set(participants)

        serializer = ConversationSerializer(conversation, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
