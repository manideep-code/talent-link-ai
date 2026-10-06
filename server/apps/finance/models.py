from django.db import models
from django.conf import settings


class Expense(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expenses')
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='client_expenses')
    item = models.CharField(max_length=255)
    date = models.DateField()
    category = models.CharField(max_length=128)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.item} - {self.amount}"


class Transaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('rejected', 'Rejected'),
        ('on_hold', 'On Hold'),
    )
    invoice_id = models.CharField(max_length=64, unique=True)
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_transactions')
    freelancer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='freelancer_transactions')
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    proof = models.FileField(upload_to='transaction_proofs/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_type = models.CharField(max_length=32, null=True, blank=True)

    def __str__(self):
        return f"{self.invoice_id} - {self.amount} - {self.status}"


class PayoutRequest(models.Model):
    METHOD_CHOICES = (
        ('bank', 'Bank Transfer'),
        ('paypal', 'PayPal'),
    )
    freelancer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payout_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=32, choices=METHOD_CHOICES, default='bank')
    status = models.CharField(max_length=32, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.freelancer} - {self.amount} - {self.status}"
