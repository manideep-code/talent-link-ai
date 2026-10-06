

from django.urls import path
from .views import (
    ContractCreate,
    ContractList,
    ContractDetail,
    ContractUpdate,
)

urlpatterns = [
    path("create/", ContractCreate.as_view(), name="contract-create"),
    path("", ContractList.as_view(), name="contract-list"),
    path("<int:pk>/", ContractDetail.as_view(), name="contract-detail"),
    path("<int:pk>/update/", ContractUpdate.as_view(), name="contract-update"),
]
