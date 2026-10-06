import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import profileService from '../../services/profileService';
import messagingStyles from '../shared/messagingStyles';
import { profileImageOrFallback } from '../../utils/profileImage';

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
  submitted: 'Submitted',
  considering: 'Considering',
  accepted: 'Hired',
  rejected: 'Rejected',
};

const styles = messagingStyles;

const ClientMessages = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [freelancers, setFreelancers] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [conversationMap, setConversationMap] = useState({});
  const [messageLoadingKey, setMessageLoadingKey] = useState(null);
  const [messageError, setMessageError] = useState('');
  const [sendingKey, setSendingKey] = useState(null);

  const fetchFreelancers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('proposals/received/');
      const proposals = Array.isArray(response.data) ? response.data : [];
      const grouped = groupProposalsByFreelancer(proposals);
      const enriched = await attachProfiles(grouped);

      // Inject permanent TalentLink system conversation at the top for clients
      const talentKey = 'talentlink';
      const talentEntry = {
        userKey: talentKey,
        userId: null,
        name: 'TalentLink',
        email: 'notifications@talentlink',
        bidAmount: null,
        completionTime: null,
        status: 'system',
        createdAt: new Date().toISOString(),
        proposals: [],
        profile: null,
      };

      // Ensure talentlink messages exist in localStorage
      try {
        const key = 'talentlink_messages';
        const existing = JSON.parse(localStorage.getItem(key) || 'null');
        if (!existing) {
          const welcome = JSON.parse(localStorage.getItem('pending_welcome') || 'null');
          const initial = [
            {
              id: 'talent-' + Date.now(),
              sender: 'talentlink',
              text: (welcome && (welcome.message || welcome.title)) || 'Welcome to TalentLink! Start exploring freelancers and post jobs to get matched.',
              timestamp: new Date().toISOString(),
            },
          ];
          localStorage.setItem(key, JSON.stringify(initial));
        }
      } catch (e) {
        // ignore
      }

      setFreelancers([talentEntry, ...enriched]);
      try {
        const stored = JSON.parse(localStorage.getItem('talentlink_messages') || '[]');
        setConversationMap((prev) => ({
          ...prev,
          [talentEntry.userKey]: { conversationId: 'talentlink', proposalId: null, messages: stored },
        }));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Error loading proposal contacts', err);
      const message = err?.response?.data?.detail || 'Unable to load freelancers for messaging.';
      setError(message);
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  useEffect(() => {
    // Track viewport to toggle desktop vs mobile layout
    const mq = window.matchMedia('(max-width: 900px)');
    const handler = (event) => setIsMobile(event.matches);
    handler(mq);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (freelancers.length && !freelancers.some((f) => f.userKey === selectedKey)) {
      setSelectedKey(freelancers[0].userKey);
    }
  }, [freelancers, selectedKey]);

  useEffect(() => {
    setMessageError('');
  }, [selectedKey]);
  const groupProposalsByFreelancer = (proposals) => {
    const map = new Map();
    proposals.forEach((proposal) => {
      const userId = proposal?.freelancer?.id;
      const userKey = userId ? `user-${userId}` : `proposal-${proposal.id}`;
      if (!map.has(userKey)) {
        map.set(userKey, {
          userKey,
          userId: userId || null,
          name: proposal.freelancer_name || proposal?.freelancer?.username || 'Freelancer',
          email: proposal.freelancer_email || proposal?.freelancer?.email || '',
          bidAmount: proposal.bid_amount,
          completionTime: proposal.completion_time,
          status: proposal.status,
          coverLetter: proposal.cover_letter,
          createdAt: proposal.created_at,
          proposals: [proposal],
        });
      } else {
        const existing = map.get(userKey);
        existing.proposals.push(proposal);
        if (new Date(proposal.created_at) > new Date(existing.createdAt)) {
          existing.createdAt = proposal.created_at;
          existing.status = proposal.status;
          existing.coverLetter = proposal.cover_letter || existing.coverLetter;
        }
      }
    });
    return Array.from(map.values());
  };

  const attachProfiles = async (items) => {
    const ids = [...new Set(items.map((item) => item.userId).filter(Boolean))];
    const profileMap = new Map();
    await Promise.all(
      ids.map(async (userId) => {
        try {
          const profile = await profileService.freelancer.getProfileByUserId(userId);
          profileMap.set(userId, profile || null);
        } catch (err) {
          console.error(`Unable to fetch profile for user ${userId}`, err);
          profileMap.set(userId, null);
        }
      })
    );
    return items.map((item) => ({
      ...item,
      profile: item.userId ? profileMap.get(item.userId) : null,
    }));
  };

  const getLatestProposal = useCallback((freelancer) => {
    if (!freelancer?.proposals?.length) return null;
    return [...freelancer.proposals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  }, []);

  const loadConversation = useCallback(
    async (freelancer, proposal) => {
      if (!freelancer || !proposal) return null;
      const key = freelancer.userKey;
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
        setMessageError('');
      }
      try {
        const ensureResponse = await axiosInstance.post('messaging/conversations/ensure/', {
          proposal_id: proposal.id,
        });
        const conversationId = ensureResponse?.data?.id;
        if (!conversationId) {
          throw new Error('Conversation ID missing');
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
        console.error('Error loading conversation', err);
        if (isActive) {
          const status = err?.response?.status;
          if (status === 401) {
            setMessageError('Session expired. Please sign in again.');
            return null;
          }
          const detail = err?.response?.data?.detail || 'Unable to load messages.';
          setMessageError(detail);
        }
        throw err;
      } finally {
        setMessageLoadingKey((prev) => (prev === key ? null : prev));
      }
    },
    [selectedKey]
  );

  const filteredFreelancers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return freelancers;
    return freelancers.filter((freelancer) => {
      const haystack = `${freelancer.name} ${freelancer.email}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [freelancers, searchTerm]);

  const selectedFreelancer = useMemo(() => {
    if (!selectedKey) return null;
    return freelancers.find((freelancer) => freelancer.userKey === selectedKey) || null;
  }, [freelancers, selectedKey]);
  const isTalentLinkSelected = selectedFreelancer?.userKey === 'talentlink';
  const activeConversation = selectedFreelancer ? conversationMap[selectedFreelancer.userKey] : null;
  const serverMessages = useMemo(() => activeConversation?.messages || [], [activeConversation]);

  useEffect(() => {
    if (!selectedFreelancer) return;
    const latestProposal = getLatestProposal(selectedFreelancer);
    if (!latestProposal) return;
    const existing = activeConversation;
    if (existing && existing.proposalId === latestProposal.id) return;
    loadConversation(selectedFreelancer, latestProposal).catch(() => {});
  }, [selectedFreelancer, activeConversation, getLatestProposal, loadConversation]);

  const visibleMessages = useMemo(() => {
    if (!selectedFreelancer) return [];
    const introMessage = selectedFreelancer.coverLetter
      ? [{ sender: 'freelancer', text: selectedFreelancer.coverLetter, timestamp: selectedFreelancer.createdAt, id: 'intro' }]
      : [];
    return [...introMessage, ...serverMessages];
  }, [selectedFreelancer, serverMessages]);

  const handleSendMessage = async () => {
    if (!selectedFreelancer) return;
    const messageText = draftMessage.trim();
    if (!messageText) return;
    const key = selectedFreelancer.userKey;
    if (sendingKey === key || messageLoadingKey === key) return;

    const latestProposal = getLatestProposal(selectedFreelancer);
    if (!latestProposal) {
      setMessageError('No proposal found for this freelancer.');
      return;
    }

    let conversationId = activeConversation?.conversationId;
    try {
      setSendingKey(key);
      if (!conversationId) {
        conversationId = await loadConversation(selectedFreelancer, latestProposal);
      }
      if (!conversationId) {
        throw new Error('Conversation missing');
      }
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
      setDraftMessage('');
    } catch (err) {
      console.error('Error sending message', err);
      const detail = err?.response?.data?.detail || 'Unable to send message.';
      setMessageError(detail);
    } finally {
      setSendingKey((prev) => (prev === key ? null : prev));
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '₹0';
    const amount = Number(value);
    if (Number.isNaN(amount)) return `₹${value}`;
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const avatarFor = (freelancer) =>
    profileImageOrFallback(freelancer?.profile?.profile_image, freelancer?.name || 'Freelancer', {
      background: '1d4ed8',
      color: 'ffffff',
    });

  const skillsFor = (profile) => {
    if (!profile) return [];
    if (Array.isArray(profile.skills)) return profile.skills;
    if (typeof profile.skills === 'string') {
      return profile.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    }
    return [];
  };

  const experienceBadge = (freelancer) => {
    const count = freelancer?.proposals?.length || 0;
    if (count <= 2) return 'Beginner · 0-2 projects';
    if (count <= 5) return 'Intermediate · 3-5 projects';
    return 'Experienced · 6+ projects';
  };

  const isThreadLoading = selectedFreelancer ? messageLoadingKey === selectedFreelancer.userKey : false;
  const isSending = selectedFreelancer ? sendingKey === selectedFreelancer.userKey : false;

  return (
    <div style={styles.page}>
      <div style={isMobile ? styles.layoutMobile : styles.layoutDesktop}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            Freelancers who applied
          </div>
          <div style={styles.searchBar}>
            <span style={styles.icon}>{icons.search}</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {loading ? (
            <div style={styles.feedback}>Loading matching freelancers...</div>
          ) : error ? (
            <div style={{ ...styles.feedback, color: '#b91c1c' }}>{error}</div>
          ) : !filteredFreelancers.length ? (
            <div style={styles.feedback}>No proposals yet. Once freelancers apply they will appear here.</div>
          ) : null}
          <div style={styles.list}>
            {filteredFreelancers.map((freelancer) => {
              const isActive = freelancer.userKey === selectedKey;
              const isTalentLink = freelancer.userKey === 'talentlink';
              return (
                <button
                  key={freelancer.userKey}
                  type="button"
                  style={{
                    ...styles.row,
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    borderLeft: isActive ? '3px solid #1d4ed8' : '3px solid transparent',
                  }}
                  onClick={() => setSelectedKey(freelancer.userKey)}
                >
                  <img src={avatarFor(freelancer)} alt={freelancer.name} style={styles.avatar} />
                  <div style={styles.meta}>
                    <div style={styles.primaryText}>{freelancer.name}</div>
                    <div style={styles.secondaryText}>{freelancer.email || 'Email not shared'}</div>
                    {!isTalentLink && (
                      <div style={styles.secondaryText}>{formatCurrency(freelancer.bidAmount)} bid</div>
                    )}
                  </div>
                  <span style={styles.statusPill}>{isTalentLink ? 'Admin' : (STATUS_LABELS[freelancer.status] || 'Pending')}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section style={styles.detailPanel}>
          {selectedFreelancer ? (
            <>
              <header style={styles.detailHeader}>
                <div style={styles.detailHeaderLeft}>
                  <img src={avatarFor(selectedFreelancer)} alt={selectedFreelancer.name} style={styles.largeAvatar} />
                  <div>
                    <div style={styles.detailName}>{selectedFreelancer.name}</div>
                    <div style={styles.detailSub}>{selectedFreelancer.email || 'Email pending'}</div>
                    {isTalentLinkSelected ? (
                      <div style={styles.detailSub}>Admin</div>
                    ) : null}
                    {!isTalentLinkSelected && (
                      <div style={styles.detailSub}>{experienceBadge(selectedFreelancer)}</div>
                    )}
                  </div>
                </div>
                {!isTalentLinkSelected && (
                  <div style={styles.detailChips}>
                    <div style={styles.detailChip}><span>Bid</span><strong>{formatCurrency(selectedFreelancer.bidAmount)}</strong></div>
                    {selectedFreelancer.completionTime && (
                      <div style={styles.detailChip}><span>Timeline</span><strong>{selectedFreelancer.completionTime}</strong></div>
                    )}
                    <div style={styles.detailChip}><span>Status</span><strong>{STATUS_LABELS[selectedFreelancer.status] || 'Pending'}</strong></div>
                  </div>
                )}
              </header>

              {isTalentLinkSelected ? (
                <div style={{ ...styles.card, marginTop: '24px' }}>
                  <h4 style={styles.cardTitle}>Welcome to TalentLink</h4>
                  <p style={styles.cardText}>
                    We are glad to have you on board. Use this space to reach the TalentLink admins for help with hiring, contracts, or product guidance.
                  </p>
                </div>
              ) : (
                <div style={styles.profileGrid}>
                  <div style={styles.card}>
                    <h4 style={styles.cardTitle}>About</h4>
                    <p style={styles.cardText}>
                      {selectedFreelancer.profile?.bio || selectedFreelancer.coverLetter || 'No description available yet.'}
                    </p>
                    {selectedFreelancer.profile?.hourly_rate && (
                      <p style={{ ...styles.cardText, marginTop: '12px' }}>
                        Preferred hourly rate: {formatCurrency(selectedFreelancer.profile.hourly_rate)}
                      </p>
                    )}
                  </div>
                  <div style={styles.card}>
                    <h4 style={styles.cardTitle}>Skills</h4>
                    <div style={styles.skillsWrap}>
                      {skillsFor(selectedFreelancer.profile).map((skill) => (
                        <span key={skill} style={styles.skillChip}>{skill}</span>
                      ))}
                      {!skillsFor(selectedFreelancer.profile).length && (
                        <span style={styles.cardText}>Skills not provided.</span>
                      )}
                    </div>
                  </div>
                  <div style={styles.card}>
                    <h4 style={styles.cardTitle}>Project Experience</h4>
                    <p style={{ ...styles.cardText, whiteSpace: 'pre-wrap' }}>
                      {selectedFreelancer.profile?.works || 'No project experience added yet.'}
                    </p>
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
                      : selectedFreelancer?.userId && message.sender_id === selectedFreelancer.userId
                        ? 'freelancer'
                        : selectedFreelancer?.email && message.sender_email === selectedFreelancer.email
                          ? 'freelancer'
                          : 'client';
                    const bubbleWrapper = derivedSender === 'client' ? styles.msgSent : styles.msgReceived;
                    const bubbleStyle = derivedSender === 'client' ? styles.bubbleSent : styles.bubbleReceived;
                    const timestamp = message.timestamp || message.created_at;
                    return (
                      <div key={message.id || `${selectedFreelancer.userKey}-${timestamp}`}
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
                    <div style={styles.emptyState}>Start the conversation by sending a message.</div>
                  )}
                  {messageError && (
                    <div style={{ ...styles.feedback, color: '#b91c1c' }}>{messageError}</div>
                  )}
                </div>
                <div style={styles.inputArea}>
                  <input
                    type="text"
                    placeholder={`Message ${selectedFreelancer.name}`}
                    style={styles.messageInput}
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending || isThreadLoading}
                  />
                  <button
                    type="button"
                    style={{
                      ...styles.sendBtn,
                      opacity: isSending || isThreadLoading ? 0.6 : 1,
                      cursor: isSending || isThreadLoading ? 'not-allowed' : 'pointer',
                    }}
                    onClick={handleSendMessage}
                    disabled={isSending || isThreadLoading}
                  >
                    {icons.send}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={styles.feedback}>Select a freelancer to view their profile and chat.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClientMessages;
