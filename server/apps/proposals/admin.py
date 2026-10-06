


from django.contrib import admin
from .models import ProjectProposal

@admin.register(ProjectProposal)
class ProjectProposalAdmin(admin.ModelAdmin):
    # We replaced 'project_title' and 'client' with helper functions below
    list_display = ("id", "project_id", "client", "freelancer", "status", "created_at")
    list_filter = ("status",)