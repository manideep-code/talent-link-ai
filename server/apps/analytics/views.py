



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated 
from django.db.models import Count, Q 
from django.db.models.functions import TruncMonth 
from datetime import datetime
from django.db import models 
from collections import Counter # --- Added for manual skill counting

# --- Model Imports ---
from apps.proposals.models import ProjectProposal
from apps.projects.models import Project

# --- Serializer Imports ---
from .serializers import ActivityAnalyticsSerializer, SkillsAnalyticsSerializer

# ----------------------------------------------------------------------------------

class ProjectAnalyticsView(APIView):
    """
    Tracks the activity of projects (both owned by client and worked on by freelancer).
    API Path: /api/v1/analytics/projects/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Updated Logic: Check if user is the Client (owner) OR the Freelancer (hired)
        monthly_activity = Project.objects.filter(
            Q(client=user) | Q(freelancer=user)
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id') 
        ).order_by('month')
        
        # Format the data
        formatted_data = [
            {'label': item['month'].strftime('%Y-%m'), 'count': item['count']}
            for item in monthly_activity
        ]
        
        serializer = ActivityAnalyticsSerializer(formatted_data, many=True)
        return Response({
            'monthly_project_activity': serializer.data
        })


class ProposalAnalyticsView(APIView):
    """
    Tracks the activity of the freelancer's proposals, grouped by status.
    API Path: /api/v1/analytics/proposals/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user 
        
        # Django ORM Query for status distribution
        status_distribution = ProjectProposal.objects.filter(
            freelancer=user
        ).values('status').annotate(
            count=Count('id') 
        ).order_by('-count')

        # Format the data
        formatted_data = [
            {'label': item['status'], 'count': item['count']}
            for item in status_distribution
        ]

        serializer = ActivityAnalyticsSerializer(formatted_data, many=True)
        return Response({
            'proposal_status_distribution': serializer.data
        })


class SkillsAnalyticsView(APIView):
    """
    Tracks the demand for skills based on Active projects.
    Updated to work with the text-based 'required_skills' field.
    API Path: /api/v1/analytics/skills/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Fetch 'required_skills' text from all Active projects
        # We use values_list to get a simple list of strings ["React, Python", "Django", ...]
        projects_skills = Project.objects.filter(status='Active').values_list('required_skills', flat=True)

        all_skills = []

        # 2. Parse the strings in Python
        for skill_string in projects_skills:
            if skill_string:
                # Split "React, Django" into ["React", "Django"] and clean whitespace
                parts = [s.strip() for s in skill_string.split(',') if s.strip()]
                all_skills.extend(parts)

        # 3. Count frequencies using Python's Counter
        skill_counts = Counter(all_skills)

        # 4. Format data for the frontend (Top 10 skills)
        # Matches the expected keys: 'skill_name' and 'project_count'
        formatted_data = [
            {'skill_name': name, 'project_count': count}
            for name, count in skill_counts.most_common(10)
        ]
        
        # We return the data directly since we manually constructed the dictionary 
        # structure that the frontend expects.
        return Response({
            'projects_per_skill': formatted_data
        })