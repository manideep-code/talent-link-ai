


from rest_framework import serializers
from .models import Project, Skill
from apps.proposals.models import ProjectProposal 

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']

class ProjectSerializer(serializers.ModelSerializer):
    # Use MethodField to safely get a name even if username is empty
    client_name = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()
    posted_on = serializers.SerializerMethodField()
    proposals_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ['client']

    def get_client_name(self, obj):
        if not obj.client:
            return "Unknown"
        return obj.client.username or obj.client.first_name or obj.client.email or f"User #{obj.client.id}"

    def get_freelancer_name(self, obj):
        if not obj.freelancer:
            return None
        return obj.freelancer.username or obj.freelancer.first_name or obj.freelancer.email or f"User #{obj.freelancer.id}"

    def get_posted_on(self, obj):
        if not obj.created_at:
            return None
        return obj.created_at.strftime("%d %b %Y")

    def get_proposals_count(self, obj):
        return ProjectProposal.objects.filter(project_id=obj.id).count()

class ProposalSerializer(serializers.ModelSerializer):
    # Safe fields: project_id (integer) and project_title resolved dynamically
    freelancer_name = serializers.ReadOnlyField(source='freelancer.username')
    project_title = serializers.SerializerMethodField()

    class Meta:
        model = ProjectProposal
        fields = [
            'id', 'project_id', 'project_title',
            'freelancer', 'freelancer_name',
            'cover_letter', 'bid_amount',
            'status', 'created_at'
        ]
        read_only_fields = ["client", "freelancer", "created_at"]
        # Unique ref_name to avoid drf-yasg serializer name collision
        ref_name = "ProposalSerializerProjects"

    def get_project_title(self, obj):
        try:
            from apps.projects.models import Project
            project = Project.objects.filter(id=obj.project_id).first()
            return project.title if project else None
        except Exception:
            return None