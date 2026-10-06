import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";
import profileService from "../services/profileService";
import { profileImageOrFallback } from "../utils/profileImage";

export default function ProposalList({ projectId, refresh }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Removed unused setInfo
  const [info] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get("/proposals/", {
          params: {
            project_id: projectId,
          },
        });
        const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
        const enriched = await attachFreelancerProfiles(data);
        setProposals(enriched);
      } catch (err) {
        console.error("Error fetching proposals:", err);
        setError("Failed to fetch proposals");
        setProposals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [projectId, refresh]);

  const attachFreelancerProfiles = async (items) => {
    const ids = [...new Set(items.map((proposal) => proposal?.freelancer?.id).filter(Boolean))];
    if (!ids.length) return items;
    const profileMap = new Map();
    await Promise.all(
      ids.map(async (userId) => {
        try {
          const profile = await profileService.freelancer.getProfileByUserId(userId);
          profileMap.set(userId, profile || null);
        } catch (err) {
          console.error(`Unable to load freelancer profile ${userId}`, err);
          profileMap.set(userId, null);
        }
      })
    );
    return items.map((proposal) => ({
      ...proposal,
      freelancer_profile: proposal?.freelancer?.id ? profileMap.get(proposal.freelancer.id) : null,
    }));
  };



  if (loading) return <p>Loading proposals...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!proposals.length) return <p>No proposals submitted yet.</p>;

  return (
    <div className="mt-6">
      <h3 className="text-2xl font-bold mb-4">Submitted Proposals</h3>
      {info && <div className="mb-2 text-green-700">{info}</div>}
      <table className="w-full border border-gray-300 rounded-md">
        <thead className="bg-[#3b82f6]">
          <tr>
            <th className="border p-2 text-white">Freelancer</th>
            <th className="border p-2 text-white">Bid Amount</th>
            <th className="border p-2 text-white">Completion Time</th>
            <th className="border p-2 text-white">Status</th>
            <th className="border p-2 text-white">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((p) => {
            const freelancerLabel = (() => {
              if (p.freelancer_name && typeof p.freelancer_name === "string") return p.freelancer_name;
              if (p.freelancer) {
                if (typeof p.freelancer === "string") return p.freelancer;
                if (typeof p.freelancer === "object") {
                  if (p.freelancer.username) return p.freelancer.username;
                  if (p.freelancer.email) return p.freelancer.email;
                  if (p.freelancer.id) return `User ${p.freelancer.id}`;
                }
              }
              return "N/A";
            })();

            const avatarSrc = profileImageOrFallback(
              p?.freelancer_profile?.profile_image,
              freelancerLabel
            );

            return (
              <tr key={p.id}>
                <td className="border p-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarSrc}
                      alt={freelancerLabel}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{freelancerLabel}</div>
                      <div className="text-xs text-gray-500">{p.freelancer_email || p?.freelancer?.email || "Email not shared"}</div>
                    </div>
                  </div>
                </td>
                <td className="border p-2">₹{p.bid_amount}</td>
                <td className="border p-2">{p.completion_time || "N/A"}</td>
                <td className="border p-2">{p.status}</td>
                <td className="border p-2">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
