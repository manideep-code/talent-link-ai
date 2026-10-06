from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class ProjectProposal(models.Model):
    STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("considering", "Considering"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_proposals", null=True, blank=True
    )

    project_id = models.IntegerField(null=True, blank=True)
    bid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    completion_time = models.CharField(max_length=100, null=True, blank=True)
    cover_letter = models.TextField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.freelancer} → Project {self.project_id} ({self.status})"


class ProposalAttachment(models.Model):
    proposal = models.ForeignKey(ProjectProposal, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='proposal_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment {self.id} for Proposal {self.proposal_id}"