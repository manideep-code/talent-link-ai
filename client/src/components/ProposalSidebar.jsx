import React, { useState, useEffect } from "react";
import { Lightbulb, ChevronRight } from "lucide-react";
import api from '../utils/axiosInstance';

const ProposalSidebar = ({ currentProjectId }) => {
  const writingTips = [
    "Write a compelling cover letter that highlights your experience",
    "Be specific about your completion timeline and deliverables",
    "Research the market rate for similar projects (in rupees)",
    "Mention relevant skills and past successful projects",
    "Keep your bid amount competitive yet reasonable (₹)",
    "Proofread your proposal before submitting",
    "Ask clarifying questions if project details are unclear",
    "Show enthusiasm for the project and the client",
  ];

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await api.get('/projects/');
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects for sidebar', err);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const [expandedProject, setExpandedProject] = useState(null);

  return (
    <aside className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 h-fit sticky top-6">
      {/* Writing Tips Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Writing Tips</h3>
        </div>
        <ul className="space-y-3">
          {writingTips.slice(0, 5).map((tip, index) => (
            <li key={index} className="flex gap-2 text-sm">
              <span className="text-yellow-500 font-bold flex-shrink-0">•</span>
              <span className="text-gray-700 leading-relaxed">{tip}</span>
            </li>
          ))}
        </ul>
        <button className="mt-4 text-sm text-[#3b82f6] font-medium hover:text-[#2563eb] transition-colors">
          View all tips →
        </button>
      </div>

      {/* Projects Section */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Projects</h3>
        <div className="space-y-3">
          {loadingProjects ? (
            <p className="text-sm text-gray-500">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects available.</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  expandedProject === project.id
                    ? "border-[#3b82f6] bg-[#3b82f6]/10"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
                onClick={() =>
                  setExpandedProject(
                    expandedProject === project.id ? null : project.id
                  )
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {project.title}
                    </h4>
                    <p className="text-xs text-gray-600">
                      — applications
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedProject === project.id ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {expandedProject === project.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        project.status === "active" || project.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-800"
                      }`}>
                        {project.status}
                      </span>
                      <button className="text-xs text-[#3b82f6] font-medium hover:text-[#2563eb] transition-colors">
                        View Project →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default ProposalSidebar;
