import re
from decimal import Decimal
from typing import Dict, List, Set, Tuple, Any, Optional

# =====================================================================
# 1. CANONICAL SKILL NORMALIZATION TAXONOMY & ALIASES
# =====================================================================

SKILL_ALIASES = {
    # Frontend
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react native": "React Native",
    "react-native": "React Native",
    "next": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angular.js": "Angular",
    "angularjs": "Angular",
    "svelte": "Svelte",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "sass": "Sass/SCSS",
    "scss": "Sass/SCSS",
    "redux": "Redux",

    # Backend
    "python": "Python",
    "django": "Django",
    "django rest framework": "Django REST Framework",
    "drf": "Django REST Framework",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "expressjs": "Express.js",
    "nest": "NestJS",
    "nestjs": "NestJS",
    "java": "Java",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "c#": "C#",
    ".net": ".NET",
    "dotnet": ".NET",
    "asp.net": "ASP.NET",
    "c++": "C++",
    "cpp": "C++",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "php": "PHP",
    "laravel": "Laravel",
    "ruby": "Ruby",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",

    # Database
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "sqlite3": "SQLite",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sql": "SQL",
    "oracle": "Oracle DB",
    "firebase": "Firebase",
    "supabase": "Supabase",

    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "azure": "Azure",
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "git": "Git",
    "github": "GitHub",
    "linux": "Linux",
    "nginx": "Nginx",
    "graphql": "GraphQL",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful": "REST APIs",

    # Design & Mobile & AI
    "figma": "Figma",
    "ui/ux": "UI/UX Design",
    "ui ux": "UI/UX Design",
    "ui": "UI Design",
    "ux": "UX Design",
    "flutter": "Flutter",
    "android": "Android",
    "ios": "iOS",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "deep learning": "Deep Learning",
    "data science": "Data Science",
}

# Related / Complementary skills mapping
COMPLEMENTARY_SKILLS = {
    "Django": {"Python", "REST APIs", "SQL", "PostgreSQL"},
    "Django REST Framework": {"Django", "Python", "REST APIs"},
    "React": {"JavaScript", "TypeScript", "HTML5", "CSS3"},
    "Next.js": {"React", "JavaScript", "TypeScript"},
    "Vue.js": {"JavaScript", "HTML5", "CSS3"},
    "Node.js": {"JavaScript", "TypeScript", "Express.js", "REST APIs"},
    "Express.js": {"Node.js", "JavaScript"},
    "PostgreSQL": {"SQL"},
    "MySQL": {"SQL"},
    "Kubernetes": {"Docker", "DevOps", "Linux"},
    "Flutter": {"Dart", "Mobile"},
}

DOMAIN_KEYWORDS = [
    "e-commerce", "ecommerce", "shopping", "payment", "fintech",
    "social", "chat", "messaging", "real-time", "analytics",
    "dashboard", "crm", "erp", "saas", "marketplace", "booking",
    "healthcare", "education", "edtech", "portfolio", "blog",
    "streaming", "video", "mobile app", "full-stack", "full stack",
    "frontend", "backend", "api", "database", "ai", "machine learning",
    "automation", "cloud", "security", "authentication", "portal"
]


def normalize_skill_name(raw: str) -> str:
    """Normalize a raw skill string into its canonical display title."""
    cleaned = raw.strip()
    if not cleaned:
        return ""
    lookup = cleaned.lower()
    # Direct match in aliases
    if lookup in SKILL_ALIASES:
        return SKILL_ALIASES[lookup]
    # Remove extra punctuation
    normalized_sub = re.sub(r"[._-]", " ", lookup).strip()
    if normalized_sub in SKILL_ALIASES:
        return SKILL_ALIASES[normalized_sub]
    # Title-case fallback
    return cleaned.title()


def extract_skills_from_text(text: str) -> Set[str]:
    """Extract known technology skills mentioned inside text descriptions."""
    if not text:
        return set()
    found = set()
    text_lower = f" {text.lower()} "

    # Check for direct phrase matches in the aliases dict
    for alias_key, canonical in SKILL_ALIASES.items():
        # Match as word boundary
        pattern = r"(?:\b|\s)" + re.escape(alias_key) + r"(?:\b|\s)"
        if re.search(pattern, text_lower):
            found.add(canonical)

    return found


def parse_comma_separated_skills(skills_field: str) -> Set[str]:
    """Parse comma or slash separated skill strings."""
    if not skills_field:
        return set()
    results = set()
    # Split by comma or slash
    parts = re.split(r"[,/|;]+", skills_field)
    for part in parts:
        normalized = normalize_skill_name(part)
        if normalized:
            results.add(normalized)
    return results


def get_all_project_skills(project) -> Set[str]:
    """Combine explicit project skills with skills extracted from title and description."""
    skills = parse_comma_separated_skills(getattr(project, "skills", ""))
    # Also extract from title & description
    title = getattr(project, "title", "")
    description = getattr(project, "description", "")
    skills.update(extract_skills_from_text(f"{title} {description}"))
    return skills


def get_all_freelancer_skills(freelancer_profile) -> Set[str]:
    """Extract skills from freelancer profile skills and works text."""
    if not freelancer_profile:
        return set()
    skills = parse_comma_separated_skills(getattr(freelancer_profile, "skills", ""))
    works = getattr(freelancer_profile, "works", "")
    portfolio = getattr(freelancer_profile, "portfolio", "")
    skills.update(extract_skills_from_text(f"{works} {portfolio}"))
    return skills


# =====================================================================
# 2. INDIVIDUAL MATCH FACTOR CALCULATORS
# =====================================================================

def calculate_skill_score(
    project_skills: Set[str],
    freelancer_skills: Set[str]
) -> Tuple[int, List[str], List[str]]:
    """
    Skill Compatibility Score (0 - 100).
    Returns (score, matched_skills_list, missing_skills_list).
    """
    if not project_skills:
        # If the project did not specify skills, provide neutral baseline
        return 75, list(freelancer_skills)[:4], []

    matched = project_skills.intersection(freelancer_skills)
    missing = project_skills.difference(freelancer_skills)

    base_ratio = len(matched) / len(project_skills)
    raw_score = base_ratio * 100

    # Complementary skill bonus for missing skills
    bonus = 0
    for missing_skill in list(missing):
        prereqs = COMPLEMENTARY_SKILLS.get(missing_skill, set())
        if prereqs and prereqs.intersection(freelancer_skills):
            bonus += 5  # Partial credit for knowing foundational/complementary tech

    final_score = int(min(100, raw_score + bonus))
    return final_score, sorted(list(matched)), sorted(list(missing))


def calculate_portfolio_score(
    project,
    freelancer_profile,
    completed_contracts_count: int = 0
) -> Tuple[int, int]:
    """
    Portfolio & Project Similarity Score (0 - 100).
    Checks overlap of domain keywords (e-commerce, fintech, API, etc.)
    and previous completed contracts.
    Returns (score, similar_projects_count).
    """
    if not freelancer_profile:
        return 50, 0

    project_text = f"{getattr(project, 'title', '')} {getattr(project, 'description', '')}".lower()
    freelancer_text = f"{getattr(freelancer_profile, 'portfolio', '')} {getattr(freelancer_profile, 'works', '')}".lower()

    # Identify domain keywords in project
    project_domains = {kw for kw in DOMAIN_KEYWORDS if kw in project_text}

    similar_count = 0
    domain_match_count = 0

    if project_domains and freelancer_text:
        for kw in project_domains:
            if kw in freelancer_text:
                domain_match_count += 1
                similar_count += 1

    # Base score on domain overlap
    if project_domains:
        overlap_ratio = domain_match_count / len(project_domains)
        score = 40 + int(overlap_ratio * 50)
    else:
        # Generic project without specialized domain
        has_portfolio = bool(getattr(freelancer_profile, "portfolio", "").strip())
        score = 75 if has_portfolio else 60

    # Bonus for completed platform work
    if completed_contracts_count > 0:
        score = min(100, score + min(15, completed_contracts_count * 3))
        similar_count += min(completed_contracts_count, 3)

    return min(100, max(20, score)), similar_count


def calculate_experience_score(
    project,
    freelancer_profile,
    completed_contracts_count: int = 0
) -> int:
    """
    Experience Compatibility Score (0 - 100).
    Compares project's required experience level ('Any', 'Beginner', 'Intermediate', 'Expert')
    with cues in freelancer works, portfolio, and platform completed projects.
    """
    req_level = (getattr(project, "experience_level", "") or "Any").strip().lower()
    if req_level in ["any", ""]:
        return 100

    works_text = f"{getattr(freelancer_profile, 'works', '')} {getattr(freelancer_profile, 'portfolio', '')}".lower()

    # Detect freelancer level
    is_expert = any(w in works_text for w in ["expert", "senior", "lead", "architect", "5+ years", "6 years", "7 years", "8 years", "10 years", "staff"]) or completed_contracts_count >= 5
    is_intermediate = any(w in works_text for w in ["intermediate", "mid-level", "2 years", "3 years", "4 years", "experienced"]) or completed_contracts_count >= 2

    freelancer_level = "expert" if is_expert else ("intermediate" if is_intermediate else "beginner")

    matrix = {
        "beginner": {"beginner": 100, "intermediate": 90, "expert": 85},
        "intermediate": {"beginner": 65, "intermediate": 100, "expert": 95},
        "expert": {"beginner": 45, "intermediate": 75, "expert": 100},
    }

    req_normalized = "expert" if "expert" in req_level or "senior" in req_level else ("intermediate" if "inter" in req_level else "beginner")
    return matrix.get(req_normalized, {}).get(freelancer_level, 80)


def calculate_budget_score(
    project,
    historical_bids: List[Decimal]
) -> int:
    """
    Budget Compatibility Score (0 - 100).
    Compares freelancer's historical bid averages with project budget range.
    Handles missing budget data gracefully without heavy penalties.
    """
    min_budget = getattr(project, "min_budget", None)
    max_budget = getattr(project, "max_budget", None)

    if not min_budget and not max_budget:
        return 85  # Neutral compatibility when project has no budget defined

    min_val = float(min_budget) if min_budget else 0.0
    max_val = float(max_budget) if max_budget else min_val * 2.0

    if not historical_bids:
        # No bid history -> Graceful neutral score per prompt instructions
        return 85

    avg_bid = float(sum(historical_bids) / len(historical_bids))

    if min_val <= avg_bid <= max_val:
        return 100
    if avg_bid < min_val:
        # Lower than min budget is very attractive to clients!
        return 95
    if avg_bid <= max_val * 1.2:
        # Within 20% over budget
        return 80
    if avg_bid <= max_val * 1.5:
        # Within 50% over budget
        return 65
    return 45


def calculate_availability_score(
    active_contracts_count: int
) -> Tuple[int, str]:
    """
    Availability Compatibility Score (0 - 100).
    Based on active in-progress contracts.
    """
    if active_contracts_count == 0:
        return 100, "Available immediately"
    elif active_contracts_count == 1:
        return 90, "Available (1 active project)"
    elif active_contracts_count == 2:
        return 75, "Partially available (2 active projects)"
    else:
        return 50, f"Busy ({active_contracts_count} active projects)"


def calculate_reputation_score(
    completed_contracts_count: int,
    total_proposals_count: int,
    accepted_proposals_count: int,
    paid_transactions_count: int
) -> Tuple[int, float]:
    """
    Reputation & Platform Activity Score (0 - 100).
    Uses Bayesian prior dampening to balance platform history reliably.
    Returns (score, calculated_rating_estimate).
    """
    # Baseline reputation for an active verified account
    base_reputation = 65

    # Bonus for completed contracts (up to +20)
    contract_bonus = min(20, completed_contracts_count * 5)

    # Acceptance rate bonus
    acceptance_bonus = 0
    if total_proposals_count > 0:
        acceptance_ratio = accepted_proposals_count / total_proposals_count
        acceptance_bonus = int(acceptance_ratio * 10)

    # Verified transaction completion bonus
    tx_bonus = min(10, paid_transactions_count * 3)

    final_score = min(100, base_reputation + contract_bonus + acceptance_bonus + tx_bonus)
    # Estimate an explainable 5-star rating (between 4.0 and 5.0)
    rating_est = round(min(5.0, 4.0 + (final_score / 100.0)), 1)

    return final_score, rating_est


def determine_match_confidence(
    project,
    freelancer_profile,
    has_bids: bool
) -> str:
    """Determine match confidence level (High, Medium, Low) based on data completeness."""
    project_points = 0
    if getattr(project, "skills", "").strip():
        project_points += 1
    if getattr(project, "min_budget", None) or getattr(project, "max_budget", None):
        project_points += 1
    if len(getattr(project, "description", "").strip()) > 30:
        project_points += 1

    freelancer_points = 0
    if freelancer_profile and getattr(freelancer_profile, "skills", "").strip():
        freelancer_points += 1
    if freelancer_profile and (getattr(freelancer_profile, "works", "").strip() or getattr(freelancer_profile, "portfolio", "").strip()):
        freelancer_points += 1
    if has_bids:
        freelancer_points += 1

    total = project_points + freelancer_points
    if total >= 5:
        return "High"
    elif total >= 3:
        return "Medium"
    return "Low"


# =====================================================================
# 3. OVERALL MATCH COMPUTATION & EXPLANATION GENERATOR
# =====================================================================

def compute_overall_match(
    project,
    freelancer_user,
    freelancer_profile,
    completed_contracts_count: int,
    active_contracts_count: int,
    historical_bids: List[Decimal],
    total_proposals: int,
    accepted_proposals: int,
    paid_transactions: int
) -> Dict[str, Any]:
    """
    Computes complete, explainable match breakdown between a Project and a Freelancer.
    Formula:
        Overall = skill_score * 0.35 +
                  portfolio_score * 0.20 +
                  experience_score * 0.15 +
                  budget_score * 0.10 +
                  availability_score * 0.10 +
                  reputation_score * 0.10
    """
    proj_skills = get_all_project_skills(project)
    fl_skills = get_all_freelancer_skills(freelancer_profile)

    skill_score, matched_skills, missing_skills = calculate_skill_score(proj_skills, fl_skills)
    portfolio_score, similar_projects_count = calculate_portfolio_score(project, freelancer_profile, completed_contracts_count)
    experience_score = calculate_experience_score(project, freelancer_profile, completed_contracts_count)
    budget_score = calculate_budget_score(project, historical_bids)
    availability_score, availability_status = calculate_availability_score(active_contracts_count)
    reputation_score, rating_estimate = calculate_reputation_score(
        completed_contracts_count, total_proposals, accepted_proposals, paid_transactions
    )

    # Weighted calculation
    weighted = (
        skill_score * 0.35 +
        portfolio_score * 0.20 +
        experience_score * 0.15 +
        budget_score * 0.10 +
        availability_score * 0.10 +
        reputation_score * 0.10
    )
    overall_score = int(round(min(100, max(0, weighted))))

    # Strengths extraction
    strengths = []
    if skill_score >= 85 and matched_skills:
        strengths.append(f"Strong match in core skills: {', '.join(matched_skills[:3])}")
    elif matched_skills:
        strengths.append(f"Matches {len(matched_skills)} required tech skills")

    if similar_projects_count > 0:
        strengths.append(f"{similar_projects_count} similar completed project{'s' if similar_projects_count != 1 else ''}")

    if availability_score >= 90:
        strengths.append("Currently available for immediate onboarding")

    if budget_score >= 90:
        strengths.append("Fits comfortably within client project budget")

    if completed_contracts_count >= 1:
        strengths.append(f"{completed_contracts_count} successfully completed contract{'s' if completed_contracts_count != 1 else ''} on TalentLink")

    # Match reasons explanation
    match_reasons = []
    if proj_skills:
        match_reasons.append(f"Matches {len(matched_skills)} of {len(proj_skills)} required skill{'s' if len(proj_skills) != 1 else ''}")
    else:
        match_reasons.append("Relevant full-stack skillset for the project")

    if similar_projects_count > 0:
        match_reasons.append(f"Has completed {similar_projects_count} similar or domain-related project{'s' if similar_projects_count != 1 else ''}")

    match_reasons.append(f"Experience aligns with the {getattr(project, 'experience_level', 'Any')} project requirements")

    if budget_score >= 80:
        match_reasons.append("Budget expectations align with client parameters")

    match_reasons.append(availability_status)

    if rating_estimate:
        match_reasons.append(f"{rating_estimate}/5 platform reputation score")

    confidence = determine_match_confidence(project, freelancer_profile, bool(historical_bids))

    return {
        "match_score": overall_score,
        "skill_score": skill_score,
        "portfolio_score": portfolio_score,
        "experience_score": experience_score,
        "budget_score": budget_score,
        "availability_score": availability_score,
        "reputation_score": reputation_score,
        "rating_estimate": rating_estimate,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "match_reasons": match_reasons,
        "availability_status": availability_status,
        "similar_projects_count": similar_projects_count,
        "completed_projects_count": completed_contracts_count,
        "confidence": confidence,
    }
