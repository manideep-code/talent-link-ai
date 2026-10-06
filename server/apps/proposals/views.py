
from django.contrib.auth import get_user_model
import logging
from django.conf import settings
from django.db.models import Q
from rest_framework import viewsets, generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import ProjectProposal, ProposalAttachment
from .serializers import ProposalSerializer, ProposalAttachmentSerializer

User = get_user_model()

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = ProjectProposal.objects.all().order_by("-created_at")
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Avoid executing user-dependent queries during schema generation
        if getattr(self, 'swagger_fake_view', False):
            return ProjectProposal.objects.none()

        user = getattr(self.request, 'user', None)
        project_id = self.request.query_params.get("project_id")
        queryset = self.queryset
        # If filtering by project_id (for client proposals page)
        if project_id:
            try:
                pid = int(project_id)
            except (ValueError, TypeError):
                logging.warning("Invalid project_id filter: %s", project_id)
                return queryset.none()
            queryset = queryset.filter(project_id=pid)
        # If user is authenticated, filter by freelancer or client
        if user and getattr(user, 'is_authenticated', False):
            role = (getattr(user, "role", "") or "").lower()
            if role == "freelancer":
                # Freelancers should only see proposals they submitted
                return queryset.filter(freelancer=user)
            # Treat as client: show proposals for projects posted by this user
            from apps.projects.models import Project
            project_ids = Project.objects.filter(client=user).values_list("id", flat=True)
            return queryset.filter(project_id__in=project_ids)

        # Unauthenticated users should not see proposals
        return queryset.none()

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ProposalSerializer(page, many=True, context=self.get_serializer_context())
                return self.get_paginated_response(serializer.data)
            serializer = ProposalSerializer(queryset, many=True, context=self.get_serializer_context())
            return Response(serializer.data)
        except Exception as e:
            logging.exception("Error listing proposals")
            if getattr(settings, "DEBUG", False):
                return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"detail": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _ensure_client(self, request, proposal):
        # Debug logging for troubleshooting
        print(f"[DEBUG] Proposal action: request.user={request.user} (id={getattr(request.user, 'id', None)}), proposal.client={proposal.client} (id={getattr(proposal.client, 'id', None)})")
        if proposal.client != request.user:
            print(f"[DEBUG] Forbidden: request.user.id={getattr(request.user, 'id', None)} != proposal.client.id={getattr(proposal.client, 'id', None)}")
            return Response({"detail": "Only the client can update this proposal."}, status=status.HTTP_403_FORBIDDEN)
        return None

    @action(detail=True, methods=["post"])
    def consider(self, request, pk=None):
        proposal = self.get_object()
        forbidden = self._ensure_client(request, proposal)
        if forbidden:
            return forbidden
        proposal.status = "considering"
        proposal.save(update_fields=["status"])
        return Response({"message": "Proposal marked as considering"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        forbidden = self._ensure_client(request, proposal)
        if forbidden:
            return forbidden

        already_accepted = ProjectProposal.objects.filter(
            client=proposal.client,
            project_id=proposal.project_id,
            status="accepted",
        ).exclude(id=proposal.id).exists()
        if already_accepted:
            return Response(
                {"detail": "A proposal for this project is already accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        proposal.status = "accepted"
        proposal.save(update_fields=["status"])
        return Response({"message": "Proposal accepted"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        proposal = self.get_object()
        forbidden = self._ensure_client(request, proposal)
        if forbidden:
            return forbidden
        proposal.status = "rejected"
        proposal.save(update_fields=["status"])
        return Response({"message": "Proposal rejected"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def received(self, request):
        user = request.user
        queryset = self.queryset
        if user and user.is_authenticated:
            from apps.projects.models import Project
            project_ids = Project.objects.filter(client=user).values_list("id", flat=True)
            queryset = queryset.filter(Q(client=user) | Q(project_id__in=project_ids))
        else:
            queryset = queryset.none()

        serializer = ProposalSerializer(queryset.order_by("-created_at"), many=True, context=self.get_serializer_context())
        return Response(serializer.data)

class ProposalCreateView(generics.CreateAPIView):
    queryset = ProjectProposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        # During schema generation (drf-yasg) avoid DB operations
        if getattr(self, 'swagger_fake_view', False):
            context["freelancer"] = None
            return context

        if self.request.user and getattr(self.request.user, 'is_authenticated', False):
            context["freelancer"] = self.request.user
        else:
            # Use email as unique identifier for the custom user model
            anonymous_user, _ = User.objects.get_or_create(
                email="anonymous@example.com",
                defaults={"first_name": "Anonymous", "is_active": False}
            )
            context["freelancer"] = anonymous_user

        return context

    def perform_create(self, serializer):
        try:
            freelancer = self.get_serializer_context().get("freelancer")
            project_id = serializer.validated_data.get("project_id")
            from apps.projects.models import Project
            project = None
            client = None
            if project_id:
                try:
                    project = Project.objects.get(id=project_id)
                    client = project.client
                except Project.DoesNotExist:
                    pass
            serializer.save(freelancer=freelancer, client=client)

            response_data = serializer.data
            response_data.update({
                "freelancer_name": f"{freelancer.first_name} {freelancer.last_name}".strip() or freelancer.username,
                "freelancer_email": freelancer.email,
            })
            self.response_data = response_data

            # Notify the client when a proposal is submitted
            try:
                if client:
                    from apps.notifications.models import create_notification

                    create_notification(
                        user=client,
                        actor=freelancer,
                        verb="proposal_submitted",
                        title="New proposal received",
                        body=f"{project.title if project else 'A project'} has a new proposal.",
                        target_type="project",
                        target_id=project.id if project else project_id,
                        metadata={"project_id": project.id if project else project_id},
                    )
            except Exception:
                pass

        except Exception as e:
            print("Error creating proposal:", e)
            raise

    def create(self, request, *args, **kwargs):
        """
        Override create to include freelancer name & email in response.
        """
        super().create(request, *args, **kwargs)
        return Response(getattr(self, 'response_data', {}), status=status.HTTP_201_CREATED)



class ProposalAttachmentUploadView(generics.CreateAPIView):
    serializer_class = ProposalAttachmentSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def post(self, request, proposal_id, *args, **kwargs):
        proposal = get_object_or_404(ProjectProposal, id=proposal_id)
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        attachment = ProposalAttachment.objects.create(proposal=proposal, file=file_obj)
        serializer = self.get_serializer(attachment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
