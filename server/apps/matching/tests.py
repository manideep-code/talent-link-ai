from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.projects.models import Project
from apps.profiles.models import FreelancerProfile, ClientProfile
from apps.contracts.models import Contract
from apps.proposals.models import ProjectProposal
from apps.matching.matching_engine import (
    calculate_skill_score,
    calculate_budget_score,
    calculate_availability_score,
    calculate_experience_score,
    compute_overall_match,
    normalize_skill_name
)
from apps.matching.models import ProjectInvitation

User = get_user_model()


class MatchingEngineUnitTests(TestCase):
    def test_skill_normalization(self):
        self.assertEqual(normalize_skill_name("react.js"), "React")
        self.assertEqual(normalize_skill_name("ReactJS"), "React")
        self.assertEqual(normalize_skill_name("nodejs"), "Node.js")
        self.assertEqual(normalize_skill_name("PostgreSQL"), "PostgreSQL")
        self.assertEqual(normalize_skill_name("postgres"), "PostgreSQL")
        self.assertEqual(normalize_skill_name("mongodb"), "MongoDB")
        self.assertEqual(normalize_skill_name("Tailwind CSS"), "Tailwind CSS")

    def test_skill_matching_exact_and_missing(self):
        project_skills = {"React", "Django", "PostgreSQL"}
        freelancer_skills = {"React", "Django", "PostgreSQL", "Python"}

        score, matched, missing = calculate_skill_score(project_skills, freelancer_skills)
        self.assertEqual(score, 100)
        self.assertIn("React", matched)
        self.assertIn("Django", matched)
        self.assertIn("PostgreSQL", matched)
        self.assertEqual(missing, [])

    def test_skill_matching_partial_with_missing(self):
        project_skills = {"React", "Django", "AWS"}
        freelancer_skills = {"React", "Django"}

        score, matched, missing = calculate_skill_score(project_skills, freelancer_skills)
        self.assertTrue(score < 100)
        self.assertIn("AWS", missing)
        self.assertEqual(set(matched), {"React", "Django"})

    def test_budget_compatibility(self):
        class MockProject:
            min_budget = Decimal("20000")
            max_budget = Decimal("35000")

        # Bid in range
        score_in_range = calculate_budget_score(MockProject(), [Decimal("25000")])
        self.assertEqual(score_in_range, 100)

        # Missing bids defaults gracefully to neutral score
        score_no_history = calculate_budget_score(MockProject(), [])
        self.assertEqual(score_no_history, 85)

        # Significantly over budget
        score_over = calculate_budget_score(MockProject(), [Decimal("70000")])
        self.assertTrue(score_over < 60)

    def test_availability_calculation(self):
        score_free, status_free = calculate_availability_score(0)
        self.assertEqual(score_free, 100)

        score_busy, status_busy = calculate_availability_score(3)
        self.assertEqual(score_busy, 50)
        self.assertIn("Busy", status_busy)


class MatchingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Client User
        self.client_user = User.objects.create_user(
            email="client_test@example.com",
            password="password123",
            first_name="Alice",
            last_name="Client",
            role="client"
        )
        ClientProfile.objects.create(
            user=self.client_user,
            company_name="Acme Corp"
        )

        # Create Another Client User (Unauthorized for Alice's projects)
        self.other_client = User.objects.create_user(
            email="other_client@example.com",
            password="password123",
            first_name="Bob",
            role="client"
        )

        # Create Freelancer User 1
        self.freelancer_1 = User.objects.create_user(
            email="rahul_dev@example.com",
            password="password123",
            first_name="Rahul",
            last_name="Sharma",
            role="freelancer"
        )
        FreelancerProfile.objects.create(
            user=self.freelancer_1,
            skills="React, Django, PostgreSQL, Python",
            works="Full-stack engineer with 4 years experience building e-commerce and web apps.",
            portfolio="https://rahul.dev"
        )

        # Create Freelancer User 2
        self.freelancer_2 = User.objects.create_user(
            email="priya_dev@example.com",
            password="password123",
            first_name="Priya",
            last_name="Patel",
            role="freelancer"
        )
        FreelancerProfile.objects.create(
            user=self.freelancer_2,
            skills="Figma, UI/UX Design, CSS3, HTML5",
            works="Product designer specializing in mobile UX."
        )

        # Create Client Project
        self.project = Project.objects.create(
            client=self.client_user,
            title="E-commerce Platform with React & Django",
            description="Need a reliable developer for an e-commerce platform using React and Django with PostgreSQL database.",
            skills="React, Django, PostgreSQL",
            min_budget=Decimal("20000"),
            max_budget=Decimal("40000"),
            duration="3 weeks",
            experience_level="Intermediate",
            status="Open"
        )

    def test_unauthenticated_access_blocked(self):
        response = self.client.get(f"/api/projects/{self.project.id}/talent-matches/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthorized_client_blocked(self):
        self.client.force_authenticate(user=self.other_client)
        response = self.client.get(f"/api/projects/{self.project.id}/talent-matches/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_talent_matches_success(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(f"/api/projects/{self.project.id}/talent-matches/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(data["project_id"], self.project.id)
        self.assertTrue(len(data["matches"]) >= 2)

        # Rahul should rank higher than Priya for a React/Django project!
        top_match = data["matches"][0]
        self.assertEqual(top_match["freelancer"]["email"], "rahul_dev@example.com")
        self.assertTrue(top_match["match_score"] >= 80)
        self.assertIn("React", top_match["matched_skills"])
        self.assertIn("Django", top_match["matched_skills"])
        self.assertTrue(len(top_match["match_reasons"]) > 0)
        self.assertTrue(len(top_match["strengths"]) > 0)

    def test_invite_freelancer_api(self):
        self.client.force_authenticate(user=self.client_user)
        payload = {
            "freelancer_id": self.freelancer_1.id,
            "message": "We loved your profile, please consider applying!"
        }
        response = self.client.post(f"/api/projects/{self.project.id}/invite/", payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertTrue(
            ProjectInvitation.objects.filter(
                project=self.project,
                freelancer=self.freelancer_1
            ).exists()
        )

    def test_freelancer_recommended_projects_api(self):
        self.client.force_authenticate(user=self.freelancer_1)
        response = self.client.get("/api/freelancers/me/recommended-projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertTrue(len(data) >= 1)
        top_project = data[0]
        self.assertEqual(top_project["id"], self.project.id)
        self.assertTrue(top_project["match_score"] >= 80)
