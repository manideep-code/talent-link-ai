from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, SkillViewSet, ProposalViewSet, get_open_projects

router = DefaultRouter()
router.register(r'skills', SkillViewSet, basename='skills')
router.register(r'proposals', ProposalViewSet, basename='proposals')
router.register(r'', ProjectViewSet, basename='projects')

urlpatterns = [
    # FIX 2: Renamed to 'marketplace/' to prevent conflicts with the router
    path('projects/', get_open_projects, name='open-projects'),
    
    # Router catch-all (Must be last)
    path('', include(router.urls)),
]