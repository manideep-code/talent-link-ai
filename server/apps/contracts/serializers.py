# # contracts/serializers.py
# from rest_framework import serializers
# from .models import Contract

# class ContractSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Contract
#         fields = [
#             "id",
#             "title",
#             "terms",
#             "start_date",
#             "end_date",
#             "status",
#             "created_at",
#             "proposal",
#             "client",
#             "freelancer",
#         ]
#         # these are set automatically on create; we don't want PATCH to change them
#         read_only_fields = ("id", "created_at", "proposal", "client", "freelancer")




from rest_framework import serializers
from .models import Contract

class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = [
            "id",
            "title",
            "terms",
            "total_amount",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "proposal",
            "client",
            "freelancer",
        ]
        read_only_fields = (
            "id",
            "created_at",
            "proposal",
            "client",
            "freelancer",
        )
