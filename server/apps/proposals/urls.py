from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProposalCreateView, ProposalViewSet, ProposalAttachmentUploadView

router = DefaultRouter()
router.register(r'', ProposalViewSet, basename='proposal')

urlpatterns = [
    path("submit/", ProposalCreateView.as_view(), name="proposal-submit"),
    path("<int:proposal_id>/attachments/", ProposalAttachmentUploadView.as_view(), name="proposal-attachments"),
    path("", include(router.urls)),
]
