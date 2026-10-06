import React, { useEffect, useState, useCallback } from 'react';
import FileUpload from '../../components/FileUpload';
import profileService from '../../services/profileService';
import axiosInstance from '../../utils/axiosInstance';

// --- SVG Icons ---
const Icons = {
  Pdf: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Image: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  File: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Upload: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
};

// documents are fetched from the profile API

const ClientDocuments = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const getIcon = (type) => {
    if (type === 'pdf') return <Icons.Pdf />;
    if (type === 'image') return <Icons.Image />;
    return <Icons.File />;
  };

  const normalizeDocs = (profile) => {
    // backend may return documents in different shapes. Try common locations.
    const candidates = [];

    const pushRaw = (r) => {
      if (!r) return;
      if (Array.isArray(r)) {
        r.forEach((it) => candidates.push(it));
        return;
      }
      // unwrap common container shape { documents: [...] } to avoid missing nested arrays
      if (typeof r === 'object' && Array.isArray(r.documents)) {
        r.documents.forEach((it) => candidates.push(it));
        return;
      }
      candidates.push(r);
    };

    // common places
    pushRaw(profile?.documents || profile?.document);
    pushRaw(profile?.client_profile?.documents);
    pushRaw(profile?.freelancer_profile?.documents);
    pushRaw(profile?.data?.documents);
    pushRaw(profile?.profile?.documents);
    // if profile itself is a string/url or array
    if (typeof profile === 'string' || Array.isArray(profile)) pushRaw(profile);

    // flatten and filter
    const rawList = candidates.flat().filter(Boolean);
    if (!rawList.length) return [];

    return rawList.map((r, idx) => {
      const url = typeof r === 'string'
        ? r
        : (r.url || r.path || r.file || r.document || r.documents || r.file_url || r.filePath || '');
      const name = (typeof r === 'string'
        ? url.split('/').pop()
        : (r.name || r.original_name || r.filename || (url && url.split('/').pop()) || `file-${idx}`));
      const lower = (url || '').toLowerCase();
      const type = lower.endsWith('.pdf') ? 'pdf' : (lower.match(/\.(png|jpg|jpeg|gif)$/i) ? 'image' : 'file');
      return { id: idx, url, name, type, size: r.size || '', date: r.uploaded_at || r.date || '' };
    });
  };

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await profileService.client.getProfile();
      console.debug('ClientDocuments: profile response', profile);
      setDocs(normalizeDocs(profile));
    } catch (err) {
      console.error('Failed to load documents', err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      console.debug('Uploading file', file);
      const res = await profileService.client.updateProfile({ documents: file });
      console.debug('Upload response', res);
      // Try to read uploaded document info from the response and merge into UI immediately.
      const uploaded = normalizeDocs(res);
      if (uploaded && uploaded.length) {
        setDocs((prev) => {
          // avoid duplicates by url
          const urls = new Set(prev.map(d => d.url));
          const merged = [...uploaded.filter(d => !urls.has(d.url)), ...prev];
          return merged;
        });
      } else {
        // fallback: refresh from server to ensure consistent shape
        await loadDocs();
      }
      alert('Document uploaded');
    } catch (err) {
      console.error('Upload failed', err, err?.response?.data);
      const serverData = err?.response?.data;
      let msg = 'Upload failed';
      if (serverData) msg = typeof serverData === 'string' ? serverData : JSON.stringify(serverData);
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (url) => {
    // try to open absolute or relative url
    if (!url) return;
    if (url.startsWith('http')) return window.open(url, '_blank');
    const apiRoot = axiosInstance.defaults.baseURL.replace(/\/api\/?$/, '');
    const link = `${apiRoot}${url.startsWith('/') ? '' : '/'}${url}`;
    window.open(link, '_blank');
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <h1 style={styles.pageTitle}>Documents</h1>
            <p style={styles.subtitle}>Keep all project files organised and within easy reach for your team.</p>
          </div>
          <div style={styles.actions}>
            <div style={styles.searchWrapper}>
              <div style={styles.searchIcon}><Icons.Search /></div>
              <input type="text" placeholder="Search files..." style={styles.searchInput} />
            </div>
            <div style={styles.uploadGroup}>
              <FileUpload label="Upload document" accept="*" onChange={handleUpload} helperText={uploading ? 'Uploading...' : ''} />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={styles.loadingState}>Loading documents...</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tHeadRow}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Date Uploaded</th>
                    <th style={styles.th}>Size</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length ? docs.map((doc) => (
                    <tr key={doc.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.fileName}>
                          <span style={styles.fileIcon}>{getIcon(doc.type)}</span>
                          {doc.name}
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.catBadge}>{doc.category || 'General'}</span></td>
                      <td style={styles.td}>{doc.date || '—'}</td>
                      <td style={styles.td}>{doc.size || '—'}</td>
                      <td style={styles.td}>
                        <button style={styles.downloadBtn} onClick={() => handleDownload(doc.url)}><Icons.Download /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={styles.emptyState}>No documents uploaded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    padding: '32px 20px 48px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
    boxSizing: 'border-box'
  },
  container: {
    maxWidth: '1380px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: '16px 24px'
  },
  titleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  pageTitle: { fontSize: '26px', fontWeight: '700', color: '#1e293b', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748b', maxWidth: '540px', lineHeight: 1.5 },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '16px',
    minWidth: '240px'
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 240px',
    maxWidth: '340px'
  },
  searchIcon: { position: 'absolute', left: '12px', display: 'flex' },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '10px',
    border: '1px solid #dbe4f0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  uploadGroup: {
    flex: '1 1 240px',
    maxWidth: '360px',
    width: '100%'
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden'
  },
  loadingState: { padding: '28px', fontSize: '14px', color: '#475569' },
  tableWrapper: { width: '100%', overflowX: 'auto', padding: '0 12px 16px' },
  table: { width: '100%', minWidth: '720px', borderCollapse: 'collapse' },
  tHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { textAlign: 'left', padding: '16px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '18px 24px', fontSize: '14px', color: '#334155' },
  fileName: { display: 'flex', alignItems: 'center', fontWeight: '500', gap: '12px' },
  fileIcon: { display: 'flex' },
  catBadge: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '600' },
  downloadBtn: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', display: 'inline-flex', padding: '6px', borderRadius: '8px', transition: 'background-color 0.2s ease, color 0.2s ease' },
  emptyState: { padding: '32px', textAlign: 'center', fontSize: '14px', color: '#64748b' }
};

export default ClientDocuments;