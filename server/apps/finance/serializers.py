from rest_framework import serializers
from .models import Expense, Transaction, PayoutRequest


class ExpenseSerializer(serializers.ModelSerializer):
    client_email = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'user', 'client', 'client_email', 'client_name', 'item', 'date', 'category', 'amount', 'receipt', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_client_email(self, obj):
        return getattr(obj.client, 'email', None)

    def get_client_name(self, obj):
        first = getattr(obj.client, 'first_name', '') or ''
        last = getattr(obj.client, 'last_name', '') or ''
        full = (first + ' ' + last).strip()
        return full or None


class TransactionSerializer(serializers.ModelSerializer):
    client_email = serializers.SerializerMethodField()
    freelancer_email = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'invoice_id', 'client', 'client_email', 'client_name', 'freelancer', 'freelancer_email', 'freelancer_name', 'description', 'amount', 'status', 'proof', 'paid_amount', 'payment_type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_client_email(self, obj):
        return getattr(obj.client, 'email', None)

    def get_freelancer_email(self, obj):
        return getattr(obj.freelancer, 'email', None)

    def get_client_name(self, obj):
        first = getattr(obj.client, 'first_name', '') or ''
        last = getattr(obj.client, 'last_name', '') or ''
        return (first + ' ' + last).strip() or None

    def get_freelancer_name(self, obj):
        first = getattr(obj.freelancer, 'first_name', '') or ''
        last = getattr(obj.freelancer, 'last_name', '') or ''
        return (first + ' ' + last).strip() or None


class PayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutRequest
        fields = ['id', 'freelancer', 'amount', 'method', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
