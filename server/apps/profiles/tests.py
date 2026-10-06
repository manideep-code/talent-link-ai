from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import FreelancerProfile

User = get_user_model()

class FreelancerProfileMeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.client.force_authenticate(user=self.user)
        self.profile = FreelancerProfile.objects.create(
            user=self.user,
            project_title="Initial Project",
            description="Initial Description",
            budget=100.00,
            required_skills="Python, Django",
            status="open"
        )

    def test_get_my_profile(self):
        url = '/api/profiles/me/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['project_title'], "Initial Project")

    def test_update_my_profile_patch(self):
        url = '/api/profiles/me/'
        data = {'project_title': 'Updated Project'}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.project_title, 'Updated Project')

    def test_update_my_profile_put(self):
        url = '/api/profiles/me/'
        data = {
            'project_title': 'Fully Updated Project',
            'description': 'Updated Description',
            'budget': 200.00,
            'required_skills': 'Python, DRF',
            'status': 'active',
            'experience_years': 5
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.project_title, 'Fully Updated Project')
        self.assertEqual(self.profile.budget, 200.00)

    def test_me_requires_authentication(self):
        self.client.logout()
        url = '/api/profiles/me/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
