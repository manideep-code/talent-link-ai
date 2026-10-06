from django.db import models
from django.conf import settings

# 1. Skill Model
class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    def __str__(self):
        return self.name

# 2. Project Model
class Project(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Pending', 'Pending'),
        ('Active', 'Active'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='posted_projects'
    )
    
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='hired_projects'
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    skills = models.TextField(help_text="Comma-separated skills like 'React, Python'", default='')
    min_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration = models.CharField(max_length=100, blank=True, default='')
    location = models.CharField(max_length=100, blank=True, default='')
    experience_level = models.CharField(max_length=50, blank=True, default='Any')
    project_type = models.CharField(max_length=50, blank=True, default='Fixed Price')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

# (Proposal Class removed from here)