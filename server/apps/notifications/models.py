from django.conf import settings
from django.db import models


class Notification(models.Model):
    EVENT_CHOICES = [
        ("project_posted", "Project Posted"),
        ("proposal_submitted", "Proposal Submitted"),
        ("message_received", "Message Received"),
        ("contract_created", "Contract Created"),
        ("contract_updated", "Contract Updated"),
        ("expense_logged", "Expense Logged"),
        ("payment_recorded", "Payment Recorded"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_notifications",
    )
    verb = models.CharField(max_length=50, choices=EVENT_CHOICES)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["verb"]),
        ]

    def __str__(self):
        return f"Notification to {self.user} ({self.verb})"


def create_notification(
    *,
    user,
    verb,
    title,
    body="",
    actor=None,
    target_type="",
    target_id=None,
    metadata=None,
):
    metadata = metadata or {}
    return Notification.objects.create(
        user=user,
        actor=actor,
        verb=verb,
        title=title,
        body=body,
        target_type=target_type,
        target_id=target_id,
        metadata=metadata,
    )


def create_notification_bulk(
    *,
    users,
    verb,
    title,
    body="",
    actor=None,
    target_type="",
    target_id=None,
    metadata=None,
):
    metadata = metadata or {}
    notifications = [
        Notification(
            user=u,
            actor=actor,
            verb=verb,
            title=title,
            body=body,
            target_type=target_type,
            target_id=target_id,
            metadata=metadata,
        )
        for u in users
    ]
    return Notification.objects.bulk_create(notifications)
