from django.urls import path
from .views import (
    ProjectTalentMatchesView,
    FreelancerRecommendedProjectsView,
    InviteFreelancerView,
    FreelancerInvitationsListView
)

urlpatterns = [
    # Client matches for a project
    path('projects/<int:project_id>/talent-matches/', ProjectTalentMatchesView.as_view(), name='project-talent-matches'),
    path('projects/<int:project_id>/invite/', InviteFreelancerView.as_view(), name='project-invite-freelancer'),

    # Freelancer recommended projects and invitations
    path('freelancers/me/recommended-projects/', FreelancerRecommendedProjectsView.as_view(), name='freelancer-recommended-projects'),
    path('freelancers/me/invitations/', FreelancerInvitationsListView.as_view(), name='freelancer-invitations'),
]
