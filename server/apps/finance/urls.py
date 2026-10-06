from django.urls import path
from . import views

urlpatterns = [
    # Freelancer
    path('freelancer/overview/', views.freelancer_overview, name='freelancer_overview'),
    path('freelancer/transactions/', views.freelancer_transactions, name='freelancer_transactions'),

    # Expenses
    path('expenses/', views.expenses_list_create, name='expenses_list_create'),

    # Payouts
    path('payout-requests/', views.create_payout_request, name='create_payout_request'),

    # Client
    path('client/overview/', views.client_overview, name='client_overview'),
    path('client/transactions/', views.client_transactions, name='client_transactions'),
    path('client/transactions/upload-proof/', views.upload_transaction_proof, name='upload_transaction_proof'),
    path('client/transactions/<str:invoice_id>/action/', views.client_transaction_action, name='client_transaction_action'),

    # test helper
    path('create-transaction/', views.create_transaction_for_test, name='create_transaction_for_test'),
]
