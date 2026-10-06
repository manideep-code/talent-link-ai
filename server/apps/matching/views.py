from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist

from .services import (
    get_talent_matches_for_project,
    get_recommended_projects_for_freelancer,
    invite_freelancer_to_project
)
from .models import ProjectInvitation
from .serializers import (
    ProjectTalentMatchesResponseSerializer,
    FreelancerRecommendedProjectSerializer,
    ProjectInvitationSerializer
)


class ProjectTalentMatchesView(APIView):
    """
    GET /api/projects/<project_id>/talent-matches/
    Calculates AI-powered match rankings and explanations for a client project.
    Only accessible by the client who owns the project.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id: int):
        # Avoid executing user-dependent queries during OpenAPI schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Response({})

        # Extract filter parameters
        filters = {}
        min_score = request.query_params.get('min_score')
        if min_score is not None:
            filters['min_score'] = min_score

        availability = request.query_params.get('availability')
        if availability:
            filters['availability'] = availability

        experience = request.query_params.get('experience')
        if experience:
            filters['experience'] = experience

        sort_by = request.query_params.get('sort_by', 'ai_match')
        limit = int(request.query_params.get('limit', 50))

        try:
            data = get_talent_matches_for_project(
                project_id=project_id,
                request_user=request.user,
                filters=filters,
                sort_by=sort_by,
                limit=limit
            )
            serializer = ProjectTalentMatchesResponseSerializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ObjectDoesNotExist as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            return Response(
                {"detail": f"An error occurred while matching talent: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FreelancerRecommendedProjectsView(APIView):
    """
    GET /api/freelancers/me/recommended-projects/
    Returns open projects ranked according to the authenticated freelancer's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(self, 'swagger_fake_view', False):
            return Response([])

        limit = int(request.query_params.get('limit', 20))

        try:
            projects = get_recommended_projects_for_freelancer(
                freelancer_user=request.user,
                limit=limit
            )
            serializer = FreelancerRecommendedProjectSerializer(projects, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"detail": f"An error occurred fetching recommendations: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InviteFreelancerView(APIView):
    """
    POST /api/projects/<project_id>/invite/
    Sends an invitation to a freelancer to apply for the client's project.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id: int):
        freelancer_id = request.data.get('freelancer_id')
        message = request.data.get('message', '')

        if not freelancer_id:
            return Response(
                {"detail": "freelancer_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = invite_freelancer_to_project(
                client_user=request.user,
                project_id=project_id,
                freelancer_id=int(freelancer_id),
                message=message
            )
            return Response(result, status=status.HTTP_201_CREATED)

        except ObjectDoesNotExist as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class FreelancerInvitationsListView(generics.ListAPIView):
    """
    GET /api/freelancers/me/invitations/
    Returns all project invitations received by the authenticated freelancer.
    """
    serializer_class = ProjectInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return ProjectInvitation.objects.none()

        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return ProjectInvitation.objects.none()

        return ProjectInvitation.objects.filter(freelancer=user).select_related('project', 'client').order_by('-created_at')
