from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count
from django.db.models import Sum, Count, F, Case, When, Value, DecimalField
from .models import Expense, Transaction, PayoutRequest
from .serializers import ExpenseSerializer, TransactionSerializer, PayoutRequestSerializer
from apps.notifications.models import create_notification
from django.utils.crypto import get_random_string
from decimal import Decimal


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def freelancer_overview(request):
    user = request.user
    # Include actual paid amounts (paid_amount) so partial payments count toward income
    income = Transaction.objects.filter(freelancer=user).aggregate(total=Sum('paid_amount'))['total'] or 0
    expenses = Expense.objects.filter(user=user).aggregate(total=Sum('amount'))['total'] or 0
    # count invoices that are not fully paid/completed
    pending_invoices = Transaction.objects.filter(freelancer=user).exclude(status__in=['paid', 'completed']).count()
    data = {
        'total_income': str(income),
        'total_expenses': str(expenses),
        'net_profit': str((income or 0) - (expenses or 0)),
        'pending_invoices': pending_invoices,
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def freelancer_transactions(request):
    user = request.user
    if request.method == 'GET':
        qs = Transaction.objects.filter(freelancer=user).order_by('-created_at')
        serializer = TransactionSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
    # POST: freelancer creates a transaction request for a client
    client_id = request.data.get('client')
    amount = request.data.get('amount')
    description = request.data.get('description', '')
    if not client_id or not amount:
        return Response({'detail': 'client and amount required'}, status=status.HTTP_400_BAD_REQUEST)
    invoice_id = get_random_string(8).upper()
    tx = Transaction.objects.create(invoice_id=invoice_id, client_id=client_id, freelancer=user, amount=amount, description=description, status='pending')
    try:
        if tx.client:
            create_notification(
                user=tx.client,
                actor=user,
                verb="expense_logged",
                title=f"Invoice {tx.invoice_id} created",
                body=description or f"{user.email} created an invoice for {tx.amount}",
                target_type="transaction",
                target_id=tx.id,
                metadata={
                    "invoice_id": tx.invoice_id,
                    "amount": str(tx.amount),
                    "actor_name": getattr(user, "name", None) or getattr(user, "email", ""),
                    "actor_profile_image": getattr(getattr(user, "profile", None), "profile_image", None),
                },
            )
    except Exception:
        # Avoid breaking invoice creation if notifications fail
        pass
    return Response(TransactionSerializer(tx, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expenses_list_create(request):
    user = request.user
    if request.method == 'GET':
        qs = Expense.objects.filter(user=user).order_by('-created_at')
        serializer = ExpenseSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
    # POST
    # POST
    data = request.data.copy()
    # do not set user in data because serializer marks it read-only;
    # pass the authenticated user to serializer.save() instead
    serializer = ExpenseSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        expense = serializer.save(user=user)
        try:
            if expense.client:
                create_notification(
                    user=expense.client,
                    actor=user,
                    verb="expense_logged",
                    title="Expense recorded",
                    body=f"{user.email} logged {expense.item} for {expense.amount}",
                    target_type="expense",
                    target_id=expense.id,
                    metadata={
                        "amount": str(expense.amount),
                        "item": expense.item,
                        "actor_name": getattr(user, "name", None) or getattr(user, "email", ""),
                        "actor_profile_image": getattr(getattr(user, "profile", None), "profile_image", None),
                    },
                )
        except Exception:
            pass
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payout_request(request):
    user = request.user
    amount = request.data.get('amount')
    method = request.data.get('method', 'bank')
    if not amount:
        return Response({'detail': 'Amount required'}, status=status.HTTP_400_BAD_REQUEST)
    pr = PayoutRequest.objects.create(freelancer=user, amount=amount, method=method)
    serializer = PayoutRequestSerializer(pr, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def client_overview(request):
    user = request.user
    # total paid amount (includes partial payments)
    spent = Transaction.objects.filter(client=user).aggregate(total=Sum('paid_amount'))['total'] or 0
    # pending: full amount for pending + remaining amount for partial
    pending = Transaction.objects.filter(client=user).aggregate(total=Sum(
        Case(
            When(status='pending', then=F('amount')),
            When(status='partial', then=F('amount') - F('paid_amount')),
            default=Value(0),
            output_field=DecimalField()
        )
    ))['total'] or 0
    last_payment = Transaction.objects.filter(client=user, status__in=['paid','completed']).order_by('-created_at').first()
    data = {
        'total_spent': str(spent),
        'pending': str(pending),
        'pending_invoices_count': Transaction.objects.filter(client=user).exclude(status__in=['paid', 'completed']).count(),
        'last_payment': str(last_payment.amount) if last_payment else None,
        'last_payment_to': getattr(last_payment.freelancer, 'email', None) if last_payment else None,
    }
    return Response(data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def client_transactions(request):
    user = request.user
    if request.method == 'GET':
        qs = Transaction.objects.filter(client=user).order_by('-created_at')
        serializer = TransactionSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
    # POST: client creates a transaction (advance/partial/full)
    freelancer_id = request.data.get('freelancer')
    amount = request.data.get('amount')
    paid_amount = request.data.get('paid_amount', 0)
    payment_type = request.data.get('payment_type')
    description = request.data.get('description', '')
    if not freelancer_id or not amount:
        return Response({'detail': 'freelancer and amount required'}, status=status.HTTP_400_BAD_REQUEST)
    invoice_id = get_random_string(8).upper()
    # determine status
    amt = Decimal(str(amount))
    paid = Decimal(str(paid_amount)) if paid_amount else Decimal('0')
    if paid >= amt:
        status_val = 'paid'
    elif paid > 0:
        status_val = 'partial'
    else:
        status_val = 'pending'
    tx = Transaction.objects.create(invoice_id=invoice_id, client=user, freelancer_id=freelancer_id, amount=amt, description=description, status=status_val, paid_amount=paid, payment_type=payment_type)
    try:
        if tx.freelancer:
            create_notification(
                user=tx.freelancer,
                actor=user,
                verb="payment_recorded",
                title=f"Payment update for {tx.invoice_id}",
                body=description or f"{user.email} recorded a payment of {paid if paid else amt}",
                target_type="transaction",
                target_id=tx.id,
                metadata={
                    "invoice_id": tx.invoice_id,
                    "amount": str(tx.amount),
                    "paid_amount": str(tx.paid_amount),
                    "status": tx.status,
                    "actor_name": getattr(user, "name", None) or getattr(user, "email", ""),
                    "actor_profile_image": getattr(getattr(user, "profile", None), "profile_image", None),
                },
            )
    except Exception:
        pass
    return Response(TransactionSerializer(tx, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def client_transaction_action(request, invoice_id):
    user = request.user
    action = request.data.get('action')
    try:
        tx = Transaction.objects.get(invoice_id=invoice_id, client=user)
    except Transaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
    if action == 'pay':
        amount = request.data.get('amount')
        payment_type = request.data.get('payment_type')
        if not amount:
            return Response({'detail': 'amount required to pay'}, status=status.HTTP_400_BAD_REQUEST)
        amt = Decimal(str(amount))
        tx.paid_amount = (tx.paid_amount or Decimal('0')) + amt
        if payment_type:
            tx.payment_type = payment_type
        if tx.paid_amount >= tx.amount:
            tx.status = 'paid'
        else:
            tx.status = 'partial'
        tx.save()
        try:
            if tx.freelancer:
                create_notification(
                    user=tx.freelancer,
                    actor=user,
                    verb="payment_recorded",
                    title=f"Payment received for {tx.invoice_id}",
                    body=f"{user.email} paid {amt}. Status: {tx.status}",
                    target_type="transaction",
                    target_id=tx.id,
                    metadata={
                        "invoice_id": tx.invoice_id,
                        "amount": str(tx.amount),
                        "paid_amount": str(tx.paid_amount),
                        "status": tx.status,
                        "actor_name": getattr(user, "name", None) or getattr(user, "email", ""),
                        "actor_profile_image": getattr(getattr(user, "profile", None), "profile_image", None),
                    },
                )
        except Exception:
            pass
        return Response(TransactionSerializer(tx, context={'request': request}).data)
    elif action == 'settle':
        # Mark invoice as fully paid/settled by client (manual settlement)
        tx.paid_amount = tx.amount
        tx.payment_type = request.data.get('payment_type') or 'manual_settle'
        tx.status = 'paid'
        tx.save()
        return Response(TransactionSerializer(tx, context={'request': request}).data)
    elif action == 'reject':
        tx.status = 'rejected'
        tx.save()
        return Response(TransactionSerializer(tx, context={'request': request}).data)
    elif action == 'hold':
        tx.status = 'on_hold'
        tx.save()
        return Response(TransactionSerializer(tx, context={'request': request}).data)
    else:
        return Response({'detail': 'unknown action'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_transaction_proof(request):
    user = request.user
    invoice_id = request.data.get('transaction_id') or request.data.get('invoice_id')
    file = request.FILES.get('proof')
    try:
        tx = Transaction.objects.get(invoice_id=invoice_id, client=user)
    except Transaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)
    if file:
        tx.proof = file
        tx.save()
        return Response({'detail': 'Uploaded'}, status=status.HTTP_200_OK)
    return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)


# Utility to create transaction for testing (not exposed publicly)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_transaction_for_test(request):
    client = request.user
    freelancer_id = request.data.get('freelancer')
    amount = request.data.get('amount')
    description = request.data.get('description', '')
    if not freelancer_id or not amount:
        return Response({'detail': 'freelancer and amount required'}, status=status.HTTP_400_BAD_REQUEST)
    invoice_id = get_random_string(8).upper()
    tx = Transaction.objects.create(invoice_id=invoice_id, client=client, freelancer_id=freelancer_id, amount=amount, description=description)
    return Response(TransactionSerializer(tx, context={'request': request}).data, status=status.HTTP_201_CREATED)
