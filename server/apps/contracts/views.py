

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import BasePermission, IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import Contract
from .serializers import ContractSerializer
from apps.proposals.models import ProjectProposal


# ---------- PERMISSION ----------
class IsContractParty(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        return user.is_authenticated and (
            user.is_staff or obj.client == user or obj.freelancer == user
        )


# ---------- CREATE CONTRACT ----------
class ContractCreate(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        proposal_id = request.data.get("proposal_id")

        if not proposal_id:
            return Response(
                {"error": "proposal_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        proposal = get_object_or_404(
            ProjectProposal.objects.select_related("client", "freelancer"),
            id=proposal_id
        )

        # Security
        if proposal.client and proposal.client != request.user and not request.user.is_staff:
            return Response(
                {"error": "Unauthorized"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prevent duplicate contract
        if Contract.objects.filter(proposal=proposal).exists():
            return Response(
                {"error": "Contract already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Auto accept proposal
        if proposal.status != "accepted":
            proposal.status = "accepted"
            proposal.save()

        contract = Contract.objects.create(
            proposal=proposal,
            client=request.user,
            freelancer=proposal.freelancer,
            title=request.data.get("title", f"Project #{proposal.project_id}"),
            terms=request.data.get("terms", proposal.cover_letter),
            total_amount=request.data.get("total_amount", proposal.bid_amount),
            start_date=request.data.get("start_date") or None,
            end_date=request.data.get("end_date") or None,
            status="active"
        )

        try:
            from apps.notifications.models import create_notification

            create_notification(
                user=proposal.freelancer,
                actor=request.user,
                verb="contract_created",
                title="New contract created",
                body=contract.title,
                target_type="contract",
                target_id=contract.id,
                metadata={"contract_id": contract.id, "proposal_id": proposal.id},
            )
        except Exception:
            pass

        return Response(
            ContractSerializer(contract).data,
            status=status.HTTP_201_CREATED
        )


# ---------- LIST ----------
class ContractList(generics.ListAPIView):
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Contract.objects.select_related(
            "client", "freelancer"
        ).order_by("-created_at")

        # Avoid executing user-dependent queries during schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Contract.objects.none()

        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return Contract.objects.none()

        if not user.is_staff:
            qs = qs.filter(Q(client=user) | Q(freelancer=user))

        return qs


# ---------- DETAIL ----------
class ContractDetail(generics.RetrieveAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsContractParty]


# ---------- UPDATE ----------
class ContractUpdate(generics.UpdateAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, IsContractParty]
    http_method_names = ["patch"]

    def perform_update(self, serializer):
        contract = serializer.save()
        try:
            from apps.notifications.models import create_notification

            create_notification(
                user=contract.freelancer,
                actor=self.request.user,
                verb="contract_updated",
                title="Contract updated",
                body=contract.title,
                target_type="contract",
                target_id=contract.id,
                metadata={"contract_id": contract.id},
            )
        except Exception:
            pass
