from rest_framework import serializers
from .models import ProjectInvitation


class FreelancerSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    name = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    avatar = serializers.CharField(allow_null=True, required=False)
    portfolio = serializers.CharField(allow_blank=True, required=False)
    works = serializers.CharField(allow_blank=True, required=False)
    skills = serializers.CharField(allow_blank=True, required=False)
    profile_id = serializers.IntegerField(allow_null=True, required=False)


class TalentMatchEntrySerializer(serializers.Serializer):
    freelancer = FreelancerSummarySerializer()
    match_score = serializers.IntegerField()
    skill_score = serializers.IntegerField()
    portfolio_score = serializers.IntegerField()
    experience_score = serializers.IntegerField()
    budget_score = serializers.IntegerField()
    availability_score = serializers.IntegerField()
    reputation_score = serializers.IntegerField()
    rating_estimate = serializers.FloatField()
    matched_skills = serializers.ListField(child=serializers.CharField())
    missing_skills = serializers.ListField(child=serializers.CharField())
    strengths = serializers.ListField(child=serializers.CharField())
    match_reasons = serializers.ListField(child=serializers.CharField())
    availability_status = serializers.CharField()
    similar_projects_count = serializers.IntegerField()
    completed_projects_count = serializers.IntegerField()
    confidence = serializers.CharField()
    invitation_status = serializers.CharField(allow_null=True, required=False)


class ProjectTalentMatchesResponseSerializer(serializers.Serializer):
    project_id = serializers.IntegerField()
    project_title = serializers.CharField()
    project_skills = serializers.ListField(child=serializers.CharField())
    min_budget = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    max_budget = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    experience_level = serializers.CharField()
    duration = serializers.CharField()
    total_candidates = serializers.IntegerField()
    matched_count = serializers.IntegerField()
    matches = TalentMatchEntrySerializer(many=True)


class FreelancerRecommendedProjectSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    description = serializers.CharField()
    client_name = serializers.CharField()
    client_id = serializers.IntegerField()
    skills = serializers.CharField()
    min_budget = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    max_budget = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    duration = serializers.CharField()
    location = serializers.CharField()
    experience_level = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    match_score = serializers.IntegerField()
    matched_skills = serializers.ListField(child=serializers.CharField())
    missing_skills = serializers.ListField(child=serializers.CharField())
    match_reasons = serializers.ListField(child=serializers.CharField())
    confidence = serializers.CharField()


class ProjectInvitationSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')
    client_name = serializers.ReadOnlyField(source='client.first_name')
    freelancer_name = serializers.ReadOnlyField(source='freelancer.first_name')

    class Meta:
        model = ProjectInvitation
        fields = [
            'id',
            'project',
            'project_title',
            'client',
            'client_name',
            'freelancer',
            'freelancer_name',
            'message',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'client', 'created_at', 'updated_at']
