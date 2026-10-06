import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const SEARCH_ITEMS = [
  {
    id: "client-dashboard",
    label: "Dashboard Overview",
    description: "Review hiring analytics and activity",
    path: "/client/dashboard",
    roles: ["client"],
    priority: 1,
    keywords: ["home", "analytics", "summary", "overview"],
  },
  {
    id: "client-projects",
    label: "Projects Pipeline",
    description: "Manage posted projects and briefs",
    path: "/client/projects",
    roles: ["client"],
    priority: 2,
    keywords: ["jobs", "briefs", "work"],
  },
  {
    id: "client-ai-matching",
    label: "AI Talent Matching",
    description: "Intelligently match top freelancers for your projects",
    path: "/client/projects",
    roles: ["client"],
    priority: 1.5,
    keywords: ["ai", "talent", "match", "matching", "recommended", "freelancers", "candidates"],
  },
  {
    id: "client-financials",
    label: "Financial Reports",
    description: "Track invoices and payments",
    path: "/client/financials",
    roles: ["client"],
    priority: 3,
    keywords: ["payments", "invoice", "transactions"]
  },
  {
    id: "client-contracts",
    label: "Contracts",
    description: "Review active and pending contracts",
    path: "/client/contracts",
    roles: ["client"],
    priority: 4,
    keywords: ["agreements", "signatures", "documents"]
  },
  {
    id: "client-freelancers",
    label: "Freelancer Directory",
    description: "Browse and shortlist freelancers",
    path: "/client/freelancers",
    roles: ["client"],
    priority: 5,
    keywords: ["talent", "people", "experts"]
  },
  {
    id: "client-proposals",
    label: "Job Proposals",
    description: "Review incoming proposals",
    path: "/client/proposals",
    roles: ["client"],
    priority: 6,
    keywords: ["bids", "submissions", "applications"]
  },
  {
    id: "client-documents",
    label: "Documents",
    description: "Access shared project documents",
    path: "/client/documents",
    roles: ["client"],
    priority: 7,
    keywords: ["files", "attachments", "assets"]
  },
  {
    id: "client-messages",
    label: "Messages",
    description: "Continue conversations with freelancers",
    path: "/client/messages",
    roles: ["client"],
    priority: 8,
    keywords: ["chat", "communication", "inbox"]
  },
  {
    id: "client-notifications",
    label: "Notifications",
    description: "See all recent alerts",
    path: "/client/notifications",
    roles: ["client"],
    priority: 9,
    keywords: ["alerts", "updates", "reminders"]
  },
  {
    id: "client-settings",
    label: "Client Settings",
    description: "Manage billing and preferences",
    path: "/client/settings",
    roles: ["client"],
    priority: 10,
    keywords: ["preferences", "account", "profile"]
  },
  {
    id: "client-help",
    label: "Help Center",
    description: "Guides and support resources",
    path: "/client/help",
    roles: ["client"],
    priority: 11,
    keywords: ["support", "faq", "guides"]
  },
  {
    id: "freelancer-dashboard",
    label: "Dashboard Overview",
    description: "Monitor your performance metrics",
    path: "/freelancer/dashboard",
    roles: ["freelancer"],
    priority: 1,
    keywords: ["overview", "summary", "analytics"]
  },
  {
    id: "freelancer-projects",
    label: "Project Listings",
    description: "Browse available projects",
    path: "/freelancer/projects",
    roles: ["freelancer"],
    priority: 2,
    keywords: ["jobs", "work", "opportunities"]
  },
  {
    id: "freelancer-ai-projects",
    label: "AI Projects For You",
    description: "Browse AI-recommended projects matched to your skillset",
    path: "/freelancer/projects",
    roles: ["freelancer"],
    priority: 1.5,
    keywords: ["ai", "recommended", "matches", "jobs", "opportunities"],
  },
  {
    id: "freelancer-clients",
    label: "Client Directory",
    description: "Discover potential clients",
    path: "/freelancer/clients",
    roles: ["freelancer"],
    priority: 3,
    keywords: ["companies", "leads", "relationships"]
  },
  {
    id: "freelancer-contracts",
    label: "Contracts",
    description: "Review agreements awaiting action",
    path: "/freelancer/contracts",
    roles: ["freelancer"],
    priority: 4,
    keywords: ["agreements", "sign", "legal"]
  },
  {
    id: "freelancer-calendar",
    label: "Calendar",
    description: "Plan deliverables and key dates",
    path: "/freelancer/calendar",
    roles: ["freelancer"],
    priority: 5,
    keywords: ["schedule", "deadlines", "timeline"]
  },
  {
    id: "freelancer-reports",
    label: "Reports",
    description: "Export and review performance reports",
    path: "/freelancer/reports",
    roles: ["freelancer"],
    priority: 6,
    keywords: ["insights", "analytics", "summary"]
  },
  {
    id: "freelancer-accounting",
    label: "Accounting",
    description: "Track income and payouts",
    path: "/freelancer/accounting",
    roles: ["freelancer"],
    priority: 7,
    keywords: ["payments", "finances", "earnings"]
  },
  {
    id: "freelancer-expenses",
    label: "Expenses",
    description: "Log project expenses",
    path: "/freelancer/expenses",
    roles: ["freelancer"],
    priority: 8,
    keywords: ["costs", "spending", "budget"]
  },
  {
    id: "freelancer-proposals",
    label: "My Proposals",
    description: "Track submitted proposals",
    path: "/freelancer/proposals",
    roles: ["freelancer"],
    priority: 9,
    keywords: ["applications", "submissions", "bids"]
  },
  {
    id: "freelancer-messages",
    label: "Messages",
    description: "Follow up on conversations",
    path: "/freelancer/messages",
    roles: ["freelancer"],
    priority: 10,
    keywords: ["chat", "communication", "inbox"]
  },
  {
    id: "freelancer-notifications",
    label: "Notifications",
    description: "See platform alerts",
    path: "/freelancer/notifications",
    roles: ["freelancer"],
    priority: 11,
    keywords: ["alerts", "updates", "reminders"]
  },
  {
    id: "freelancer-settings",
    label: "Freelancer Settings",
    description: "Adjust preferences and profile",
    path: "/freelancer/settings",
    roles: ["freelancer"],
    priority: 12,
    keywords: ["account", "profile", "preferences"]
  },
  {
    id: "freelancer-inquiry",
    label: "Support Inquiry",
    description: "Reach out for help",
    path: "/freelancer/inquiry",
    roles: ["freelancer"],
    priority: 13,
    keywords: ["support", "help", "assist"]
  },
  {
    id: "freelancer-help",
    label: "Help Center",
    description: "Guidance on using the freelancer workspace",
    path: "/freelancer/help",
    roles: ["freelancer"],
    priority: 13.5,
    keywords: ["help", "faq", "support", "guide"]
  },
  {
    id: "freelancer-profile",
    label: "View Profile",
    description: "See your public freelancer profile",
    path: "/freelancer/profile",
    roles: ["freelancer"],
    priority: 14,
    keywords: ["portfolio", "profile", "public"]
  },
  {
    id: "freelancer-edit-profile",
    label: "Edit Profile",
    description: "Update your freelancer details",
    path: "/freelancer/profile/edit",
    roles: ["freelancer"],
    priority: 15,
    keywords: ["profile", "edit", "update"]
  }
];

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const getSuggestions = useCallback((role, limit = 7) => {
    const normalizedRole = role || "common";
    const cleanedQuery = searchTerm.trim().toLowerCase();
    const eligible = SEARCH_ITEMS.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes("common") || item.roles.includes(normalizedRole);
    });

    const sorted = eligible
      .slice()
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    if (!cleanedQuery) {
      return sorted.slice(0, limit);
    }

    const matches = sorted.filter((item) => {
      const haystack = [
        item.label,
        item.description,
        ...(item.keywords || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(cleanedQuery);
    });

    return matches.slice(0, limit);
  }, [searchTerm]);

  const value = useMemo(() => ({ searchTerm, setSearchTerm, getSuggestions }), [searchTerm, getSuggestions]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
