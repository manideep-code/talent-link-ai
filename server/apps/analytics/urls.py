# SERVER/apps/analytics/urls.py

from django.urls import path
from .views import ProjectAnalyticsView, SkillsAnalyticsView, ProposalAnalyticsView # Import your views

urlpatterns = [
    # API path: /api/v1/analytics/projects/
    path('projects/', ProjectAnalyticsView.as_view(), name='project-analytics'),
    
    # API path: /api/v1/analytics/proposals/ (You'd create a similar view for proposals)
    # path('proposals/', ProposalAnalyticsView.as_view(), name='proposal-analytics'),
    
    # API path: /api/v1/analytics/skills/
    path('skills/', SkillsAnalyticsView.as_view(), name='skills-analytics'),
    path('proposals/', ProposalAnalyticsView.as_view(), name='proposal-status'),
]