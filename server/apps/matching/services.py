from typing import Dict, List, Any, Optional
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist

from apps.projects.models import Project
from apps.profiles.models import FreelancerProfile
from apps.proposals.models import ProjectProposal
from apps.contracts.models import Contract
from apps.finance.models import Transaction
from apps.notifications.models import create_notification
from .models import ProjectInvitation
from .matching_engine import compute_overall_match, get_all_project_skills

User = get_user_model()


def get_talent_matches_for_project(
    project_id: int,
    request_user,
    filters: Optional[Dict[str, Any]] = None,
    sort_by: Optional[str] = None,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Retrieves and ranks eligible freelancers for a specific client project.
    Validates ownership and applies filtering & sorting.
    """
    filters = filters or {}
    sort_by = (sort_by or 'ai_match').lower()

    # 1. Fetch project & verify client authorization
    try:
        project = Project.objects.select_related('client').get(id=project_id)
    except Project.DoesNotExist:
        raise ObjectDoesNotExist(f"Project with ID {project_id} not found.")

    if not request_user.is_staff and project.client_id != request_user.id:
        raise PermissionDenied("You are not authorized to view talent matches for this project.")

    # 2. Retrieve eligible candidate freelancers
    candidates = User.objects.filter(
        role='freelancer',
        is_active=True
    ).exclude(
        id=project.client_id
    ).prefetch_related('freelancer_profile')

    total_candidates = candidates.count()

    # 3. Pre-fetch existing invitations for this project
    existing_invites = {
        inv.freelancer_id: inv.status
        for inv in ProjectInvitation.objects.filter(project=project)
    }

    # 4. Evaluate each candidate freelancer
    matches: List[Dict[str, Any]] = []

    for freelancer in candidates:
        # Get latest profile
        profile = freelancer.freelancer_profile.order_by('-created_at').first()

        # Freelancer platform metrics
        completed_contracts_count = Contract.objects.filter(
            freelancer=freelancer,
            status__iexact='completed'
        ).count()

        active_contracts_count = Contract.objects.filter(
            freelancer=freelancer,
            status__in=['active', 'in_progress']
        ).count()

        historical_bids = list(
            ProjectProposal.objects.filter(freelancer=freelancer)
            .exclude(bid_amount__isnull=True)
            .values_list('bid_amount', flat=True)
        )

        total_proposals = ProjectProposal.objects.filter(freelancer=freelancer).count()
        accepted_proposals = ProjectProposal.objects.filter(freelancer=freelancer, status='accepted').count()

        paid_transactions = Transaction.objects.filter(
            freelancer=freelancer,
            status__in=['paid', 'completed']
        ).count()

        # Compute match breakdown
        score_data = compute_overall_match(
            project=project,
            freelancer_user=freelancer,
            freelancer_profile=profile,
            completed_contracts_count=completed_contracts_count,
            active_contracts_count=active_contracts_count,
            historical_bids=historical_bids,
            total_proposals=total_proposals,
            accepted_proposals=accepted_proposals,
            paid_transactions=paid_transactions
        )

        # Assemble freelancer summary
        full_name = f"{freelancer.first_name} {freelancer.last_name}".strip() or freelancer.email.split('@')[0]
        avatar_url = profile.profile_image.url if (profile and profile.profile_image) else None

        freelancer_summary = {
            "id": freelancer.id,
            "email": freelancer.email,
            "name": full_name,
            "first_name": freelancer.first_name,
            "last_name": freelancer.last_name,
            "avatar": avatar_url,
            "portfolio": getattr(profile, "portfolio", ""),
            "works": getattr(profile, "works", ""),
            "skills": getattr(profile, "skills", ""),
            "profile_id": getattr(profile, "id", None),
        }

        invitation_status = existing_invites.get(freelancer.id, None)

        match_entry = {
            "freelancer": freelancer_summary,
            "invitation_status": invitation_status,
            **score_data
        }

        # Apply filters
        min_score = filters.get('min_score')
        if min_score is not None:
            try:
                if match_entry['match_score'] < int(min_score):
                    continue
            except (ValueError, TypeError):
                pass

        availability_filter = filters.get('availability')
        if availability_filter and availability_filter.lower() == 'immediate':
            if match_entry['availability_score'] < 90:
                continue

        experience_filter = filters.get('experience')
        if experience_filter and experience_filter.lower() != 'all':
            if match_entry['experience_score'] < 70:
                continue

        matches.append(match_entry)

    # 5. Apply sorting
    if sort_by in ['rating', 'reputation']:
        matches.sort(key=lambda m: (m['reputation_score'], m['match_score']), reverse=True)
    elif sort_by == 'experience':
        matches.sort(key=lambda m: (m['experience_score'], m['match_score']), reverse=True)
    elif sort_by == 'budget':
        matches.sort(key=lambda m: (m['budget_score'], m['match_score']), reverse=True)
    elif sort_by == 'availability':
        matches.sort(key=lambda m: (m['availability_score'], m['match_score']), reverse=True)
    else:  # 'ai_match' default
        matches.sort(key=lambda m: (m['match_score'], m['reputation_score']), reverse=True)

    project_skills_list = sorted(list(get_all_project_skills(project)))

    return {
        "project_id": project.id,
        "project_title": project.title,
        "project_skills": project_skills_list,
        "min_budget": project.min_budget,
        "max_budget": project.max_budget,
        "experience_level": project.experience_level,
        "duration": project.duration,
        "total_candidates": total_candidates,
        "matched_count": len(matches),
        "matches": matches[:limit]
    }


def get_recommended_projects_for_freelancer(
    freelancer_user,
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Ranks open projects matching the authenticated freelancer's profile.
    """
    profile = freelancer_user.freelancer_profile.order_by('-created_at').first()

    open_projects = Project.objects.filter(
        status__in=['Open', 'Pending', 'Active'],
        freelancer__isnull=True
    ).exclude(
        client=freelancer_user
    ).order_by('-created_at')

    completed_contracts_count = Contract.objects.filter(
        freelancer=freelancer_user,
        status__iexact='completed'
    ).count()

    active_contracts_count = Contract.objects.filter(
        freelancer=freelancer_user,
        status__in=['active', 'in_progress']
    ).count()

    historical_bids = list(
        ProjectProposal.objects.filter(freelancer=freelancer_user)
        .exclude(bid_amount__isnull=True)
        .values_list('bid_amount', flat=True)
    )

    total_proposals = ProjectProposal.objects.filter(freelancer=freelancer_user).count()
    accepted_proposals = ProjectProposal.objects.filter(freelancer=freelancer_user, status='accepted').count()

    paid_transactions = Transaction.objects.filter(
        freelancer=freelancer_user,
        status__in=['paid', 'completed']
    ).count()

    ranked_projects = []

    for project in open_projects:
        score_data = compute_overall_match(
            project=project,
            freelancer_user=freelancer_user,
            freelancer_profile=profile,
            completed_contracts_count=completed_contracts_count,
            active_contracts_count=active_contracts_count,
            historical_bids=historical_bids,
            total_proposals=total_proposals,
            accepted_proposals=accepted_proposals,
            paid_transactions=paid_transactions
        )

        ranked_projects.append({
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "client_name": project.client.first_name or project.client.email.split('@')[0],
            "client_id": project.client_id,
            "skills": project.skills,
            "min_budget": project.min_budget,
            "max_budget": project.max_budget,
            "duration": project.duration,
            "location": project.location,
            "experience_level": project.experience_level,
            "status": project.status,
            "created_at": project.created_at,
            "match_score": score_data["match_score"],
            "matched_skills": score_data["matched_skills"],
            "missing_skills": score_data["missing_skills"],
            "match_reasons": score_data["match_reasons"][:3],
            "confidence": score_data["confidence"]
        })

    # Sort projects by match score descending
    ranked_projects.sort(key=lambda p: p['match_score'], reverse=True)
    return ranked_projects[:limit]


def invite_freelancer_to_project(
    client_user,
    project_id: int,
    freelancer_id: int,
    message: str = ""
) -> Dict[str, Any]:
    """
    Client invites a freelancer to apply for a project.
    Dispatches a native in-app notification to the freelancer.
    """
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        raise ObjectDoesNotExist("Project not found.")

    if not client_user.is_staff and project.client_id != client_user.id:
        raise PermissionDenied("You can only invite freelancers to projects you own.")

    try:
        freelancer = User.objects.get(id=freelancer_id, role='freelancer')
    except User.DoesNotExist:
        raise ObjectDoesNotExist("Target freelancer not found.")

    invitation, created = ProjectInvitation.objects.update_or_create(
        project=project,
        freelancer=freelancer,
        defaults={
            "client": client_user,
            "message": message or f"Hello {freelancer.first_name or 'there'}, I would like to invite you to review my project '{project.title}' and submit a proposal.",
            "status": "pending"
        }
    )

    # Dispatch native in-app Notification to the freelancer
    try:
        create_notification(
            user=freelancer,
            actor=client_user,
            verb="project_posted",
            title=f"New Project Invitation: {project.title}",
            body=f"{client_user.first_name or 'A client'} invited you to submit a proposal for '{project.title}'.",
            target_type="project",
            target_id=project.id,
            metadata={
                "project_id": project.id,
                "invitation_id": invitation.id,
                "action": "invited"
            }
        )
    except Exception:
        pass

    return {
        "invitation_id": invitation.id,
        "project_id": project.id,
        "freelancer_id": freelancer.id,
        "status": invitation.status,
        "created": created,
        "message": invitation.message
    }
