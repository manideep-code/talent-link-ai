import React, { useState } from "react";

const Icons = {
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  ChevronUp: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  ),
  Headset: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
    </svg>
  ),
  Book: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  ),
  Sparkle: () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8-1.8 4.7-1.8-4.7-4.7-1.8 4.7-1.8z" />
      <path d="M5 3l.8 2 .2.8.8.2 2 .8-2 .8-.8.2L5 9l-.8-2-.2-.8-.8-.2L1 6l2-.8.8-.2.2-.8z" />
      <path d="M19 15l.9 1.9.2.9.9.2L23 19l-2-.9-.9-.2-.2-.9z" />
    </svg>
  )
};

const faqSections = [
  {
    title: "Profile & Readiness",
    items: [
      {
        question: "How do I complete my freelancer profile?",
        answer: [
          "Go to Profile → Edit Profile and fill out headline, overview, and hourly or project rates.",
          "Upload 2–3 portfolio pieces that best represent your work and add relevant skills.",
          "Toggle Availability to let clients know if you are taking on new projects."
        ]
      },
      {
        question: "What boosts my ranking in client searches?",
        answer: [
          "Keep your response time under 24 hours and maintain an approval rate above 90%.",
          "Collect testimonials by marking completed contracts as Case Studies in the contract summary.",
          "Add certifications or verified skills from the Skills tab to earn highlight badges."
        ]
      }
    ]
  },
  {
    title: "Finding The Right Work",
    items: [
      {
        question: "How do I discover projects that fit my skills?",
        answer: [
          "Open Projects and apply filters for budget, timeline, and required skills.",
          "Save searches and enable alerts so new matching briefs are emailed instantly.",
          "Use the Recommend toggle to surface briefs our matching engine flags as a strong fit."
        ]
      },
      {
        question: "How do I submit a standout proposal?",
        answer: [
          "Click Submit Proposal on the project page and outline your approach and estimated timeline.",
          "Break pricing into milestones to help clients understand deliverables and payment stages.",
          "Attach supporting files or past work to build confidence in your expertise."
        ]
      }
    ]
  },
  {
    title: "Managing Contracts",
    items: [
      {
        question: "What happens after the client accepts my proposal?",
        answer: [
          "An agreement is generated automatically. Review the milestones and sign electronically.",
          "Once both signatures are captured, milestone 1 will be funded so you can begin work.",
          "Access shared files and messages from the contract workspace to stay aligned."
        ]
      },
      {
        question: "How do I request changes to a contract milestone?",
        answer: [
          "Open the contract, select the milestone, and click Request Update.",
          "Provide the new amount or deadline and add context for why the change is needed.",
          "The client will be prompted to approve or counter before the milestone is updated."
        ]
      }
    ]
  },
  {
    title: "Deliverables & Payments",
    items: [
      {
        question: "How do I submit work for approval?",
        answer: [
          "Within the contract workspace, choose Submit Deliverable and upload files or link to hosted work.",
          "Add release notes or handoff instructions so the client understands what to review.",
          "We notify the client immediately and log all feedback inside the same thread."
        ]
      },
      {
        question: "When will I get paid?",
        answer: [
          "Approved milestones release within one business day to your wallet.",
          "Visit Accounting → Wallet to withdraw via bank transfer, PayPal, or scheduled payout.",
          "Export payment history anytime for bookkeeping or tax filings."
        ]
      }
    ]
  },
  {
    title: "Support & Best Practices",
    items: [
      {
        question: "Who can I contact if I'm blocked?",
        answer: [
          "Message the client in the contract workspace first so they see context.",
          "For platform issues, start a chat using the help bubble or email support@talentlink.com.",
          "Report safety or policy concerns through the escalation form linked in each contract footer."
        ]
      },
      {
        question: "How do I keep my workload organized?",
        answer: [
          "Sync your Calendar page to Google or Outlook so milestone dates show on your personal calendar.",
          "Use the Tasks tab inside each contract to create personal todos tied to deliverables.",
          "Turn on smart reminders to receive nudges 48 hours before due dates." 
        ]
      }
    ]
  }
];

export default function FreelancerHelp() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Help Center</h1>
          <p style={styles.pageSubtitle}>Guides, workflows, and tools to help you win projects and deliver confidently.</p>
        </div>
        <div style={styles.quickActions}>
          <input type="search" placeholder="Search resources" style={styles.searchInput} />
          <button style={styles.contactButton}>Message Support</button>
        </div>
      </div>

      <div style={styles.grid}>
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

        <div style={styles.sidebar}>
          <div style={styles.card}>
            <div style={{ marginBottom: "15px" }}><Icons.Headset /></div>
            <h3 style={styles.cardTitle}>Live Support</h3>
            <p style={styles.cardText}>Chat with success coaches who specialize in freelancer workflows.</p>
            <button style={styles.supportBtn}>Open Chat</button>
          </div>

          <div style={styles.card}>
            <div style={{ marginBottom: "15px" }}><Icons.Book /></div>
            <h3 style={styles.cardTitle}>Resource Library</h3>
            <p style={styles.cardText}>Explore proposal templates, pricing guides, and best practices.</p>
            <button style={styles.secondaryBtn}>Browse Resources</button>
          </div>

          <div style={styles.card}>
            <div style={{ marginBottom: "15px" }}><Icons.Sparkle /></div>
            <h3 style={styles.cardTitle}>Freelancer Playbook</h3>
            <p style={styles.cardText}>Download the step-by-step playbook for winning briefs and retaining clients.</p>
            <button style={styles.secondaryBtn}>Download Playbook</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100%', margin: 0, padding: '28px 36px', boxSizing: 'border-box', background: 'linear-gradient(135deg, #f9fafb 0%, #e0f2fe 100%)', minHeight: '100%' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0 },
  pageSubtitle: { fontSize: '15px', color: '#475569', marginTop: '8px', maxWidth: '500px' },
  quickActions: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  searchInput: { padding: '10px 16px', borderRadius: '999px', border: '1px solid #bae6fd', backgroundColor: 'white', minWidth: '220px', fontSize: '14px', boxShadow: '0 6px 12px rgba(14, 165, 233, 0.15)', color: '#0f172a' },
  contactButton: { padding: '10px 20px', borderRadius: '999px', border: 'none', background: 'linear-gradient(120deg, #14b8a6, #0ea5e9)', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 18px rgba(14, 165, 233, 0.2)' },
  grid: { display: 'flex', gap: '32px', alignItems: 'flex-start' },
  main: { flex: 7, minWidth: 0 },
  sidebar: { flex: 5, minWidth: '320px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignContent: 'start' },
  sectionTitle: { fontSize: "20px", fontWeight: "bold", color: "#1e293b", marginBottom: "20px" },
  sectionSubTitle: { fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "12px", marginTop: "4px", letterSpacing: "0.02em" },
  faqList: { display: "flex", flexDirection: "column", gap: "18px" },
  faqItem: { backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" },
  question: { padding: "15px 20px", fontWeight: "600", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", backgroundColor: "#fff", width: "100%", border: "none", textAlign: "left" },
  answer: { padding: "0 20px 20px 20px", color: "#64748b", fontSize: "14px", lineHeight: "1.6" },
  answerList: { margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" },
  answerListItem: { fontSize: "14px" },
  answerText: { margin: 0 },
  icon: { color: "#94a3b8", display: "flex" },
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', boxShadow: '0 18px 34px rgba(15, 23, 42, 0.08)' },
  cardTitle: { fontSize: "16px", fontWeight: "bold", color: "#1e293b", marginBottom: "8px" },
  cardText: { fontSize: "13px", color: "#64748b", marginBottom: "20px" },
  supportBtn: { width: '100%', padding: '12px 16px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 14px 24px rgba(14, 165, 233, 0.18)' },
  secondaryBtn: { width: '100%', padding: '12px 16px', backgroundColor: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }
};
