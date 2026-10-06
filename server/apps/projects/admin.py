# apps/projects/admin.py
from django.contrib import admin
from .models import Project, Skill

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'freelancer', 'created_at')

# You should also register Skill
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name',)