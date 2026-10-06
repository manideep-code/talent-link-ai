from django.contrib import admin
from .models import Expense, Transaction, PayoutRequest


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'item', 'amount', 'date', 'created_at')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('invoice_id', 'client', 'freelancer', 'amount', 'status', 'created_at')


@admin.register(PayoutRequest)
class PayoutRequestAdmin(admin.ModelAdmin):
    list_display = ('freelancer', 'amount', 'method', 'status', 'created_at')
