import logging
from rest_framework import serializers
from .models import ProjectProposal, ProposalAttachment
from apps.projects.models import Project
from django.contrib.auth import get_user_model

User = get_user_model()

class FreelancerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email"]

class ProposalAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalAttachment
        fields = ['id', 'proposal', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
class ProposalSerializer(serializers.ModelSerializer):
    freelancer = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()
    freelancer_email = serializers.SerializerMethodField()
    attachments = ProposalAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectProposal
        fields = [
            "id",
            "freelancer",
            "client",
            "project_id",
            "project_title",
            "client_name",
            "client_email",
            "freelancer_name",
            "freelancer_email",
            "bid_amount",
            "completion_time",
            "cover_letter",
            "status",
            "created_at",
            "attachments",
        ]
        read_only_fields = ["freelancer", "status", "created_at"]
        # Unique ref_name to avoid drf-yasg serializer name collision
        ref_name = "ProposalSerializerProposals"

    def get_freelancer(self, obj):
        try:
            if getattr(obj, 'freelancer_id', None) is None:
                return None
            return FreelancerSerializer(obj.freelancer).data
        except Exception:
            logging.exception("Error serializing freelancer for proposal %s", getattr(obj, 'id', None))
            return None

    def get_client_name(self, obj):
        client = getattr(obj, "client", None)
        if not client:
            return "Unknown Client"
        full_name = f"{getattr(client, 'first_name', '')} {getattr(client, 'last_name', '')}".strip()
        return full_name or getattr(client, "username", None) or getattr(client, "email", "Unknown Client")

    def get_client_email(self, obj):
        client = getattr(obj, "client", None)
        return getattr(client, "email", "") if client else ""

    def get_freelancer_name(self, obj):
        freelancer = getattr(obj, "freelancer", None)
        if not freelancer:
            return "Unknown Freelancer"
        full_name = f"{getattr(freelancer, 'first_name', '')} {getattr(freelancer, 'last_name', '')}".strip()
        return full_name or getattr(freelancer, "username", None) or getattr(freelancer, "email", "Unknown Freelancer")

    def get_freelancer_email(self, obj):
        freelancer = getattr(obj, "freelancer", None)
        return getattr(freelancer, "email", "") if freelancer else ""

    def get_project_title(self, obj):
        pid = getattr(obj, "project_id", None)
        if not pid:
            return None
        try:
            project = Project.objects.filter(id=pid).only("title").first()
            return project.title if project else f"Project #{pid}"
        except Exception:
            logging.exception("Error resolving project title for proposal %s", getattr(obj, 'id', None))
            return f"Project #{pid}"

    def create(self, validated_data):
        freelancer = self.context.get("freelancer")
        if freelancer:
            validated_data["freelancer"] = freelancer
        return super().create(validated_data)
