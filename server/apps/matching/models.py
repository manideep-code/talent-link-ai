from django.db import models
from django.conf import settings


class ProjectInvitation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    )

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_project_invitations'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_project_invitations'
    )
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('project', 'freelancer')

    def __str__(self):
        return f"Invite: {self.client} -> {self.freelancer} for Project #{self.project_id} ({self.status})"


class TalentMatchCache(models.Model):
    """
    Optional cache to store pre-calculated match scores for fast retrieval and pagination.
    """
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='talent_matches_cache'
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='project_matches_cache'
    )
    match_score = models.IntegerField(default=0)
    skill_score = models.IntegerField(default=0)
    portfolio_score = models.IntegerField(default=0)
    experience_score = models.IntegerField(default=0)
    budget_score = models.IntegerField(default=0)
    availability_score = models.IntegerField(default=0)
    reputation_score = models.IntegerField(default=0)
    breakdown = models.JSONField(default=dict, blank=True)
    confidence = models.CharField(max_length=20, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_score', '-updated_at']
        unique_together = ('project', 'freelancer')

    def __str__(self):
        return f"Match: Freelancer {self.freelancer_id} on Project {self.project_id} ({self.match_score}%)"
