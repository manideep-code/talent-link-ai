from django.contrib import admin
from .models import Contract

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    # columns
    list_display = (
        "id", "proposal", "client", "freelancer",
        "status", "start_date", "end_date", "created_at",
    )
    # sidebar filters
    list_filter = ("status", "created_at")
    # search by related fields (note the double underscores)
    search_fields = ("title", "proposal__project_title", "client__username", "freelancer__username")

    # quality-of-life improvements
    list_select_related = ("proposal", "client", "freelancer")  # fewer queries
    ordering = ("-created_at",)                                 # newest first
    date_hierarchy = "created_at"                                # date drilldown on top
    readonly_fields = ("created_at",)                            # don’t edit timestamps
    list_per_page = 25
