from django.db import models
from django.conf import settings

class FreelancerProfile(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='freelancer_profile'
    )
    
    # New Profile Fields
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    skills = models.TextField(help_text="Comma separated skills", blank=True)
    portfolio = models.TextField(help_text="Link to portfolio or description", blank=True)
    works = models.TextField(help_text="Work Experience description", blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.email}"

class ClientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='client_profile'
    )
    
    # Client Specific Fields
    company_name = models.CharField(max_length=255, blank=True)
    company_description = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    # New Fields
    projects = models.TextField(help_text="Current or past projects", blank=True)
    skills = models.TextField(help_text="Skills required by freelancer", blank=True)
    works = models.TextField(help_text="Work Experience or portfolio", blank=True)
    
    profile_image = models.ImageField(upload_to='client_profiles/', null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Client Profile of {self.user.email}"