import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import profileService from "../../services/profileService";
import { profileImageOrFallback } from "../../utils/profileImage";
import messagingStyles from "../shared/messagingStyles";

const icons = {
  send: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const STATUS_LABELS = {
  submitted: "Submitted",
  considering: "Considering",
  accepted: "Hired",
  rejected: "Rejected",
};

const FreelancerMessages = () => {
  const location = useLocation();
  const clientHint = location.state?.clientHint;
  const [isMobile, setIsMobile] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [conversationMap, setConversationMap] = useState({});
  const [messageLoadingKey, setMessageLoadingKey] = useState(null);
  const [messageError, setMessageError] = useState("");
  const [sendingKey, setSendingKey] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("proposals/");
      const proposals = Array.isArray(response.data) ? response.data : [];
      const grouped = groupByClient(proposals);
      const enriched = await attachClientProfiles(grouped);

      // Inject permanent TalentLink system conversation at the top
      const talentKey = 'talentlink';
      const talentEntry = {
        clientKey: talentKey,
        clientId: null,
        name: 'TalentLink',
        email: 'notifications@talentlink',
        lastProject: 'Welcome Message',
        status: 'system',
        createdAt: new Date().toISOString(),
        proposals: [],
        profile: null,
      };

      // Ensure talentlink messages exist in localStorage
      const ensureLocalTalentMessages = () => {
        try {
          const key = 'talentlink_messages';
          const existing = JSON.parse(localStorage.getItem(key) || 'null');
          if (!existing) {
            const welcome = JSON.parse(localStorage.getItem('pending_welcome') || 'null');
            const initial = [
              {
                id: 'talent-' + Date.now(),
                sender: 'talentlink',
                text: (welcome && (welcome.message || welcome.title)) || 'Welcome to TalentLink! Explore projects and respond to messages to get started.',
                timestamp: new Date().toISOString(),
              },
            ];
            localStorage.setItem(key, JSON.stringify(initial));
            return initial;
          }
          return existing;
        } catch (e) {
          return [];
        }
      };

      ensureLocalTalentMessages();

      setClients([talentEntry, ...enriched]);
      try {
        const stored = JSON.parse(localStorage.getItem('talentlink_messages') || '[]');
        setConversationMap((prev) => ({
          ...prev,
          [talentEntry.clientKey]: { conversationId: 'talentlink', proposalId: null, messages: stored },
        }));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("Error loading client conversations", err);
      const message = err?.response?.data?.detail || "Unable to load client messages.";
      setError(message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    // Track viewport to switch layout between desktop and mobile
    const mq = window.matchMedia("(max-width: 900px)");
    const handler = (event) => setIsMobile(event.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (clients.length && !clients.some((client) => client.clientKey === selectedKey)) {
      setSelectedKey(clients[0].clientKey);
    }
  }, [clients, selectedKey]);

  useEffect(() => {
    if (!clientHint || !clients.length) return;
    const match = clients.find((client) => {
      const key = client.clientKey;
      return key === clientHint || key === `client-${clientHint}` || client.email === clientHint || client.name === clientHint;
    });
    if (match) {
      setSelectedKey(match.clientKey);
    }
  }, [clientHint, clients]);

  useEffect(() => {
    setMessageError("");
  }, [selectedKey]);

  const groupByClient = (proposals) => {
    const map = new Map();
    proposals.forEach((proposal) => {
      const clientId = proposal.client || proposal.client_id;
      const key = clientId ? `client-${clientId}` : `proposal-${proposal.id}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          clientKey: key,
          clientId: clientId || null,
          name: proposal.client_name || "Client",
          email: proposal.client_email || "",
          lastProject: proposal.project_title || proposal.job_title || (proposal.project_id ? `Project #${proposal.project_id}` : "Project"),
          status: proposal.status,
          createdAt: proposal.created_at,
          proposals: [proposal],
        });
        return;
      }
      existing.proposals.push(proposal);
      if (new Date(proposal.created_at) > new Date(existing.createdAt)) {
        existing.createdAt = proposal.created_at;
        existing.status = proposal.status;
        existing.lastProject = proposal.project_title || proposal.job_title || existing.lastProject;
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const attachClientProfiles = async (items) => {
    const ids = [...new Set(items.map((item) => item.clientId).filter(Boolean))];
    if (!ids.length) return items;
    const profileMap = new Map();
    await Promise.all(
      ids.map(async (userId) => {
        try {
          const profile = await profileService.client.getProfileByUserId(userId);
          profileMap.set(userId, profile || null);
        } catch (err) {
          console.error(`Unable to fetch client profile ${userId}`, err);
          profileMap.set(userId, null);
        }
      })
    );
    return items.map((item) => ({
      ...item,
      profile: item.clientId ? profileMap.get(item.clientId) : null,
    }));
  };

  const getLatestProposal = useCallback((client) => {
    if (!client?.proposals?.length) return null;
    return [...client.proposals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, []);

  const loadConversation = useCallback(
    async (client, proposal) => {
      if (!client || !proposal) return null;
      const key = client.clientKey;
      // Handle local TalentLink conversation
      if (key === 'talentlink') {
        try {
          const stored = JSON.parse(localStorage.getItem('talentlink_messages') || '[]');
          setConversationMap((prev) => ({
            ...prev,
            [key]: { conversationId: 'talentlink', proposalId: null, messages: stored },
          }));
          return 'talentlink';
        } catch (e) {
          console.error('Error loading talentlink local messages', e);
        }
      }
      const isActive = key === selectedKey;
      setMessageLoadingKey(key);
      if (isActive) {
        setMessageError("");
      }
      try {
        const ensureResponse = await axiosInstance.post("messaging/conversations/ensure/", {
          proposal_id: proposal.id,
        });
        const conversationId = ensureResponse?.data?.id;
        if (!conversationId) {
          throw new Error("Conversation ID missing");
        }
        const messagesResponse = await axiosInstance.get(`messaging/conversations/${conversationId}/messages/`);
        const messages = Array.isArray(messagesResponse.data) ? messagesResponse.data : [];
        setConversationMap((prev) => ({
          ...prev,
          [key]: {
            conversationId,
            proposalId: proposal.id,
            messages,
          },
        }));
        return conversationId;
      } catch (err) {
        console.error("Error loading conversation", err);
        if (isActive) {
          const status = err?.response?.status;
          if (status === 401) {
            setMessageError("Session expired. Please sign in again.");
            return null;
          }
          const detail = err?.response?.data?.detail || "Unable to load messages.";
          setMessageError(detail);
        }
        throw err;
      } finally {
        setMessageLoadingKey((prev) => (prev === key ? null : prev));
      }
    },
    [selectedKey]
  );

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) => `${client.name} ${client.email}`.toLowerCase().includes(query));
  }, [clients, searchTerm]);

  const selectedClient = useMemo(() => {
    if (!selectedKey) return null;
    return clients.find((client) => client.clientKey === selectedKey) || null;
  }, [clients, selectedKey]);
  const isTalentLinkSelected = selectedClient?.clientKey === 'talentlink';

  const proposalMessages = useMemo(() => {
    if (!selectedClient) return [];
    return [...selectedClient.proposals]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .filter((proposal) => proposal.cover_letter)
      .map((proposal) => ({
        id: `proposal-${proposal.id}`,
        sender: "freelancer",
        text: proposal.cover_letter,
        timestamp: proposal.created_at,
      }));
  }, [selectedClient]);

  const latestProposal = useMemo(() => getLatestProposal(selectedClient), [selectedClient, getLatestProposal]);

  const projectTags = useMemo(() => {
    if (!selectedClient) return [];
    const labels = selectedClient.proposals.map((proposal) => proposal.project_title || proposal.job_title || (proposal.project_id ? `Project #${proposal.project_id}` : "Project"));
    return Array.from(new Set(labels)).slice(0, 6);
  }, [selectedClient]);

  const activeConversation = selectedClient ? conversationMap[selectedClient.clientKey] : null;
  const serverMessages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

  useEffect(() => {
    if (!selectedClient) return;
    if (!latestProposal) return;
    if (activeConversation && activeConversation.proposalId === latestProposal.id) return;
    loadConversation(selectedClient, latestProposal).catch(() => {});
  }, [selectedClient, latestProposal, activeConversation, loadConversation]);

  const visibleMessages = useMemo(() => {
    if (!selectedClient) return [];
    return [...proposalMessages, ...serverMessages];
  }, [proposalMessages, selectedClient, serverMessages]);

  const handleSendMessage = async () => {
    if (!selectedClient) return;
    const messageText = draftMessage.trim();
    if (!messageText) return;
    const key = selectedClient.clientKey;
    if (sendingKey === key || messageLoadingKey === key) return;

    if (!latestProposal) {
      setMessageError("No proposal found for this client.");
      return;
    }

    let conversationId = activeConversation?.conversationId;

    try {
      setSendingKey(key);
      if (!conversationId) {
        conversationId = await loadConversation(selectedClient, latestProposal);
      }
      if (!conversationId) {
        throw new Error("Conversation missing");
      }
      // If this is the local TalentLink thread, persist to localStorage instead of calling server
      if (key === 'talentlink') {
        const storedKey = 'talentlink_messages';
        try {
          const existing = JSON.parse(localStorage.getItem(storedKey) || '[]');
          const newMsg = { id: 'local-' + Date.now(), sender: 'user', text: messageText, timestamp: new Date().toISOString() };
          const updated = [...existing, newMsg];
          localStorage.setItem(storedKey, JSON.stringify(updated));
          setConversationMap((prev) => ({
            ...prev,
            [key]: { conversationId: 'talentlink', proposalId: null, messages: updated },
          }));
        } catch (e) {
          console.error('Error saving talentlink message', e);
          throw e;
        }
      } else {
        const response = await axiosInstance.post(`messaging/conversations/${conversationId}/messages/`, {
          text: messageText,
        });

        setConversationMap((prev) => {
          const existing = prev[key] || { conversationId, proposalId: latestProposal.id, messages: [] };
          return {
            ...prev,
            [key]: {
              ...existing,
              conversationId,
              proposalId: latestProposal.id,
              messages: [...(existing.messages || []), response.data],
            },
          };
        });
      }
      setDraftMessage("");
    } catch (err) {
      console.error("Error sending message", err);
      const detail = err?.response?.data?.detail || "Unable to send message.";
      setMessageError(detail);
    } finally {
      setSendingKey((prev) => (prev === key ? null : prev));
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const avatarFor = (client) =>
    profileImageOrFallback(client?.profile?.profile_image, client?.name || client?.email || "Client", {
      background: "0f172a",
      color: "ffffff",
    });

  const isThreadLoading = selectedClient ? messageLoadingKey === selectedClient.clientKey : false;
  const isSending = selectedClient ? sendingKey === selectedClient.clientKey : false;

  return (
    <>
      <div style={styles.page}>
        <div style={isMobile ? styles.layoutMobile : styles.layoutDesktop}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>Clients you contacted</div>
          <div style={styles.searchBar}>
            <span style={styles.icon}>{icons.search}</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search clients"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {loading ? (
            <div style={styles.feedback}>Loading message threads...</div>
          ) : error ? (
            <div style={{ ...styles.feedback, color: "#b91c1c" }}>{error}</div>
          ) : !filteredClients.length ? (
            <div style={styles.feedback}>No messages yet. Apply to projects to start conversations.</div>
          ) : null}
          <div style={styles.list}>
            {filteredClients.map((client) => {
              const isActive = client.clientKey === selectedKey;
              const isTalentLink = client.clientKey === 'talentlink';
              return (
                <button
                  key={client.clientKey}
                  type="button"
                  style={{
                    ...styles.row,
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    borderLeft: isActive ? "3px solid #0f172a" : "3px solid transparent",
                  }}
                  onClick={() => setSelectedKey(client.clientKey)}
                >
                  <img src={avatarFor(client)} alt={client.name} style={styles.avatar} />
                  <div style={styles.meta}>
                    <div style={styles.primaryText}>{client.name}</div>
                    <div style={styles.secondaryText}>{client.email || "Email not shared"}</div>
                    {!isTalentLink && (
                      <div style={styles.secondaryText}>{client.lastProject}</div>
                    )}
                  </div>
                  <span style={styles.statusPill}>{isTalentLink ? 'Admin' : (STATUS_LABELS[client.status] || "Pending")}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section style={styles.detailPanel}>
          {selectedClient ? (
            <>
              <header style={styles.detailHeader}>
                <div style={styles.detailHeaderLeft}>
                  <img src={avatarFor(selectedClient)} alt={selectedClient.name} style={styles.largeAvatar} />
                  <div>
                    <div style={styles.detailName}>{selectedClient.name}</div>
                    <div style={styles.detailSub}>{selectedClient.email || "Contact not shared"}</div>
                    {isTalentLinkSelected ? (
                      <div style={styles.detailSub}>Admin</div>
                    ) : (
                      <div style={styles.detailSub}>{selectedClient.lastProject}</div>
                    )}
                  </div>
                </div>
                {!isTalentLinkSelected && (
                  <div style={styles.detailChips}>
                    <div style={styles.detailChip}><span>Status</span><strong>{STATUS_LABELS[selectedClient.status] || "Pending"}</strong></div>
                    <div style={styles.detailChip}><span>Opportunities</span><strong>{selectedClient.proposals.length}</strong></div>
                    <div style={styles.detailChip}><span>Last activity</span><strong>{formatTime(selectedClient.createdAt)}</strong></div>
                  </div>
                )}
              </header>

              <div style={styles.detailBody}>
                {isTalentLinkSelected ? (
                  <div style={{ ...styles.card, width: '100%' }}>
                    <h4 style={styles.cardTitle}>Welcome to TalentLink</h4>
                    <p style={styles.cardText}>
                      Our team is here to help you connect with great opportunities. Use this channel to reach the TalentLink admins whenever you need assistance.
                    </p>
                  </div>
                ) : (
                  <div style={styles.profileGrid}>
                    <div style={styles.card}>
                      <h4 style={styles.cardTitle}>About this client</h4>
                      <p style={styles.cardText}>
                        {latestProposal?.client_notes || `You last reached out about ${selectedClient.lastProject}. Keep the client updated on milestones and next steps.`}
                      </p>
                      <p style={{ ...styles.cardText, marginTop: "12px" }}>
                        {selectedClient.email ? `Preferred contact: ${selectedClient.email}` : "Contact details pending."}
                      </p>
                    </div>
                    <div style={styles.card}>
                      <h4 style={styles.cardTitle}>Projects discussed</h4>
                      <div style={styles.skillsWrap}>
                        {projectTags.map((tag) => (
                          <span key={tag} style={styles.skillChip}>{tag}</span>
                        ))}
                        {!projectTags.length && (
                          <span style={styles.cardText}>No project history yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.chatSection}>
                  <div style={styles.messages}>
                    {isThreadLoading && (
                      <div style={styles.feedback}>Loading conversation...</div>
                    )}
                    {visibleMessages.map((message) => {
                      const derivedSender = message.sender
                        ? message.sender
                        : selectedClient?.clientId && message.sender_id === selectedClient.clientId
                          ? "client"
                          : selectedClient?.email && message.sender_email === selectedClient.email
                            ? "client"
                            : "freelancer";
                      const bubbleWrapper = derivedSender === "freelancer" ? styles.msgSent : styles.msgReceived;
                      const bubbleStyle = derivedSender === "freelancer" ? styles.bubbleSent : styles.bubbleReceived;
                      const timestamp = message.timestamp || message.created_at;
                      return (
                        <div
                          key={message.id || `${selectedClient.clientKey}-${timestamp}`}
                          style={bubbleWrapper}
                        >
                          <div style={bubbleStyle}>
                            {message.text}
                          </div>
                          <div style={styles.msgTime}>{formatTime(timestamp)}</div>
                        </div>
                      );
                    })}
                    {!visibleMessages.length && !isThreadLoading && (
                      <div style={styles.emptyState}>Send a quick update to keep the conversation going.</div>
                    )}
                    {messageError && (
                      <div style={{ ...styles.feedback, color: "#b91c1c" }}>{messageError}</div>
                    )}
                  </div>

                  <div style={styles.inputArea}>
                    <input
                      type="text"
                      placeholder={`Message ${selectedClient.name}`}
                      style={styles.messageInput}
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      type="button"
                      style={{
                        ...styles.sendBtn,
                        opacity: isSending || isThreadLoading ? 0.6 : 1,
                        cursor: isSending || isThreadLoading ? "not-allowed" : "pointer",
                      }}
                      onClick={handleSendMessage}
                      disabled={isSending || isThreadLoading}
                    >
                      {icons.send}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.feedback}>Select a client to view messages.</div>
          )}
        </section>
      </div>
      </div>
    </>
  );
};
const styles = messagingStyles;

export default FreelancerMessages;
