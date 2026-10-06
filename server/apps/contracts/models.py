




from django.db import models
from django.conf import settings

class Contract(models.Model):
    proposal = models.OneToOneField(
        "proposals.ProjectProposal",
        on_delete=models.CASCADE,
        related_name="contract",
    )

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_contracts"
    )

    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="freelancer_contracts"
    )

    title = models.CharField(max_length=200)
    terms = models.TextField()

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contract {self.id} for Proposal {self.proposal_id}"
