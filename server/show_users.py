import os
import django

# 1. Setup Django so we can access the database
# We assume your project folder is named 'server' based on your screenshots.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

# 2. Get the User model
from django.contrib.auth import get_user_model
User = get_user_model()

# 3. Print all users
print("\n" + "="*40)
print(" SEARCHING FOR USERS...")
print("="*40)

users = User.objects.all()

if users.exists():
    for user in users:
        print(f"USERNAME :  {user.username}")
        print(f"EMAIL    :  {user.email}")
        print(f"SUPERUSER:  {user.is_superuser}")
        print("-" * 20)
else:
    print("No users found! You need to run 'createsuperuser'.")

print("="*40 + "\n")