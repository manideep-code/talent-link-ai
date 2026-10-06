import React, { useState } from 'react';

// --- SVG Icons ---
const Icons = {
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ChevronUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>,
  Headset: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>,
  Book: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  Sparkle: () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8-1.8 4.7-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M5 3l.8 2 .2.8.8.2 2 .8-2 .8-.8.2L5 9l-.8-2-.2-.8-.8-.2L1 6l2-.8.8-.2.2-.8z"/><path d="M19 15l.9 1.9.2.9.9.2L23 19l-2-.9-.9-.2-.2-.9z"/></svg>
};

const faqSections = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How do I set up my client workspace?',
        answer: [
          'Navigate to Settings → Organization and add your company logo, billing address, and default currency.',
          'Invite teammates from the Team Access tab so they can collaborate on projects and approvals.',
          'Review notification preferences to control which email alerts you receive.'
        ]
      },
      {
        question: 'What is the fastest way to post the first project?',
        answer: [
          'Select Projects → Create Project and choose a template closest to the work you need.',
          'Provide a clear brief including deliverables, timeline, and budget type.',
          'Publish privately to invited freelancers or publicly to the full marketplace.'
        ]
      }
    ]
  },
  {
    title: 'Working With Freelancers',
    items: [
      {
        question: 'How do I shortlist and invite freelancers to my project?',
        answer: [
          'Use the Freelancer Directory filters to narrow talent by skills, rate, and availability.',
          'Open any profile to see experience, portfolio items, and reviews from other clients.',
          'Click Invite to Project and select the brief you want them to propose on.'
        ]
      },
      {
        question: 'Where can I review proposals and compare estimates?',
        answer: [
          'Go to Proposals to see every submission, grouped by project.',
          'Open a proposal to compare deliverables, pricing milestones, and proposed schedule.',
          'Use the Compare toggle to view two proposals side-by-side before accepting.'
        ]
      },
      {
        question: 'How do I turn an accepted proposal into a contract?',
        answer: [
          'Accept the proposal to auto-create a draft contract with suggested milestones.',
          'Adjust milestone dates or amounts if needed, then click Activate Contract.',
          'The freelancer receives a signature request instantly and work can begin once both parties agree.'
        ]
      }
    ]
  },
  {
    title: 'Collaborating On Projects',
    items: [
      {
        question: 'How do I share briefs, files, and feedback in one place?',
        answer: [
          'Every contract automatically includes a shared workspace with Message threads and a Files tab.',
          'Upload reference material or brand assets under Files so freelancers always see the latest versions.',
          'Use @mentions inside Messages to alert specific teammates or freelancers when feedback is ready.'
        ]
      },
      {
        question: 'Can I automate status updates for stakeholders?',
        answer: [
          'Enable progress digest emails from Settings → Notifications → Project Updates.',
          'Add stakeholders as read-only viewers so they receive milestone completion alerts without editing access.'
        ]
      }
    ]
  },
  {
    title: 'Payments & Compliance',
    items: [
      {
        question: 'How do milestone payments work?',
        answer: [
          'Fund upcoming milestones from Financials → Fund Milestone using card or ACH.',
          'Once the freelancer submits a delivery, approve or request changes from the Contracts view.',
          'Approved milestones release automatically within one business day, and receipts appear in Documents → Invoices.'
        ]
      },
      {
        question: 'Where do I download invoices and year-end summaries?',
        answer: [
          'Head to Documents and filter by Invoices or Tax Summaries.',
          'Use the Export button for CSV or PDF copies of all transactions during a selected date range.'
        ]
      },
      {
        question: 'Can I manage vendor paperwork inside TalentLink?',
        answer: [
          'Yes. Upload NDAs and compliance forms under Contracts → Documents so freelancers sign before work begins.',
          'Track signature status from the same page and resend reminders with one click.'
        ]
      }
    ]
  },
  {
    title: 'Support & Administration',
    items: [
      {
        question: 'How do I control who can approve work or payments?',
        answer: [
          'Assign roles in Settings → Team Access. Approvers can release funds while collaborators can only comment.',
          'Use the Activity log to review who approved milestones or edited project scopes.'
        ]
      },
      {
        question: 'What support is available if I get stuck?',
        answer: [
          'Start a live chat from the help bubble on any page for real-time onboarding assistance.',
          'Email support@talentlink.com for dedicated account help within four hours on business days.',
          'Enterprise clients can schedule a quarterly workflow review with our success team.'
        ]
      }
    ]
  }
];

const ClientHelp = () => {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Help Center</h1>
          <p style={styles.pageSubtitle}>Answers, onboarding guides, and quick actions to keep your team moving.</p>
        </div>
        <div style={styles.quickActions}>
          <input type="search" placeholder="Search articles" style={styles.searchInput} />
          <button style={styles.contactButton}>Talk to Support</button>
        </div>
      </div>

      <div style={styles.grid}>
        {/* FAQ Section */}
        <div style={styles.main}>
          <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div style={styles.faqList}>
            {faqSections.map((section, sectionIndex) => (
              <div key={section.title}>
                <h3 style={styles.sectionSubTitle}>{section.title}</h3>
                {section.items.map((faq, itemIndex) => {
                  const id = `${sectionIndex}-${itemIndex}`;
                  const isOpen = openId === id;
                  return (
                    <div key={id} style={styles.faqItem}>
                      <button type="button" style={styles.question} onClick={() => toggle(id)}>
                        <span>{faq.question}</span>
                        <span style={styles.icon}>{isOpen ? <Icons.ChevronUp /> : <Icons.ChevronDown />}</span>
                      </button>
                      {isOpen && (
                        <div style={styles.answer}>
                          {Array.isArray(faq.answer) ? (
                            <ul style={styles.answerList}>
                              {faq.answer.map((step, stepIndex) => (
                                <li key={stepIndex} style={styles.answerListItem}>{step}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={styles.answerText}>{faq.answer}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div style={styles.sidebar}>
          <div style={styles.card}>
            <div style={{marginBottom: '15px'}}><Icons.Headset /></div>
            <h3 style={styles.cardTitle}>Need more help?</h3>
            <p style={styles.cardText}>Our support team is available 24/7 to assist you.</p>
            <button style={styles.supportBtn}>Contact Support</button>
          </div>

          <div style={styles.card}>
            <div style={{marginBottom: '15px'}}><Icons.Book /></div>
            <h3 style={styles.cardTitle}>Knowledge Base</h3>
            <p style={styles.cardText}>Read detailed guides on how to use the platform.</p>
            <button style={styles.secondaryBtn}>Browse Articles</button>
          </div>

          <div style={styles.card}>
            <div style={{marginBottom: '15px'}}><Icons.Sparkle /></div>
            <h3 style={styles.cardTitle}>Client Onboarding</h3>
            <p style={styles.cardText}>Download the interactive checklist to roll out TalentLink across your team.</p>
            <button style={styles.secondaryBtn}>Download Checklist</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', margin: 0, padding: '28px 36px', boxSizing: 'border-box', background: 'linear-gradient(135deg, #f9fafb 0%, #eef2ff 100%)', minHeight: '100%' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#1e293b', margin: 0 },
  pageSubtitle: { fontSize: '15px', color: '#475569', marginTop: '8px', maxWidth: '540px' },
  quickActions: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { padding: '10px 16px', borderRadius: '999px', border: '1px solid #cbd5f5', backgroundColor: 'white', minWidth: '220px', fontSize: '14px', boxShadow: '0 6px 12px rgba(79, 70, 229, 0.12)', color: '#1e293b' },
  contactButton: { padding: '10px 20px', borderRadius: '999px', border: 'none', background: 'linear-gradient(120deg, #4f46e5, #3b82f6)', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 18px rgba(59, 130, 246, 0.18)' },
  grid: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  main: { flex: 7, minWidth: 0 },
  sidebar: { flex: 5, minWidth: '320px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignContent: 'start' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '20px' },
  faqList: { display: 'flex', flexDirection: 'column', gap: '18px' },
  faqItem: { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  question: { padding: '15px 20px', fontWeight: '600', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: '#fff', width: '100%', border: 'none', textAlign: 'left' },
  answer: { padding: '0 20px 20px 20px', color: '#64748b', fontSize: '14px', lineHeight: '1.6' },
  answerList: { margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  answerListItem: { fontSize: '14px' },
  answerText: { margin: 0 },
  icon: { color: '#94a3b8', display: 'flex' },
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '0 18px 34px rgba(15, 23, 42, 0.08)' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' },
  cardText: { fontSize: '13px', color: '#64748b', marginBottom: '20px' },
  supportBtn: { width: '100%', padding: '12px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 14px 24px rgba(59, 130, 246, 0.18)' },
  secondaryBtn: { width: '100%', padding: '12px 16px', backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  sectionSubTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', marginTop: '4px', letterSpacing: '0.02em' }
};

export default ClientHelp;