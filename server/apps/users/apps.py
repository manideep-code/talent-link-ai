from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'  # <--- Crucial: Must be 'apps.users', not just 'users'
    label = 'users'      # <--- This allows you to keep referring to it as 'users.User'