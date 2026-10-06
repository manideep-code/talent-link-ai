# SERVER/apps/analytics/serializers.py

from rest_framework import serializers

# Used for monthly activity (projects) and status distribution (proposals)
class ActivityAnalyticsSerializer(serializers.Serializer):
    """Serializes aggregated data with a label and a count."""
    label = serializers.CharField(max_length=100) # e.g., '2025-12' or 'Pending'
    count = serializers.IntegerField()

# Used for projects per skill
class SkillsAnalyticsSerializer(serializers.Serializer):
    """Serializes data for projects grouped by skill name."""
    skill_name = serializers.CharField(max_length=100)
    project_count = serializers.IntegerField()