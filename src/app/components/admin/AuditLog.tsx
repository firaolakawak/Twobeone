import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight, User, Link2, BookOpen, MessageSquare, Heart, FileText, CheckSquare, BarChart2, Settings, Trash2, GraduationCap, Users, Globe, AlertCircle, FlaskConical } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface AuditEntry {
  id: string;
  event: string;
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  metadata: Record<string, any>;
  timestamp: string;
}

interface AuditLogProps {
  accessToken: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  'user.signup': <User className="w-3.5 h-3.5" />,
  'user.email_verified': <CheckSquare className="w-3.5 h-3.5" />,
  'couple.linked': <Link2 className="w-3.5 h-3.5" />,
  'couple.unlinked': <Link2 className="w-3.5 h-3.5" />,
  'devotional.completed': <BookOpen className="w-3.5 h-3.5" />,
  'prayer.created': <Heart className="w-3.5 h-3.5" />,
  'prayer.answered': <CheckSquare className="w-3.5 h-3.5" />,
  'journal.created': <FileText className="w-3.5 h-3.5" />,
  'qa.answered': <MessageSquare className="w-3.5 h-3.5" />,
  'mood.logged': <BarChart2 className="w-3.5 h-3.5" />,
  'profile.updated': <User className="w-3.5 h-3.5" />,
  'admin.privilege_granted': <Settings className="w-3.5 h-3.5" />,
  'admin.privilege_revoked': <Settings className="w-3.5 h-3.5" />,
  'admin.devotional_created': <BookOpen className="w-3.5 h-3.5" />,
  'admin.devotional_updated': <BookOpen className="w-3.5 h-3.5" />,
  'admin.devotional_deleted': <Trash2 className="w-3.5 h-3.5" />,
  'admin.devotionals_imported': <BookOpen className="w-3.5 h-3.5" />,
  'admin.question_created': <MessageSquare className="w-3.5 h-3.5" />,
  'admin.question_updated': <MessageSquare className="w-3.5 h-3.5" />,
  'admin.question_deleted': <Trash2 className="w-3.5 h-3.5" />,
  'admin.module_created': <GraduationCap className="w-3.5 h-3.5" />,
  'admin.module_updated': <GraduationCap className="w-3.5 h-3.5" />,
  'admin.module_deleted': <Trash2 className="w-3.5 h-3.5" />,
  'admin.modules_imported': <GraduationCap className="w-3.5 h-3.5" />,
  'admin.group_created': <Users className="w-3.5 h-3.5" />,
  'admin.group_updated': <Users className="w-3.5 h-3.5" />,
  'admin.group_deleted': <Trash2 className="w-3.5 h-3.5" />,
  'admin.user_deleted': <Trash2 className="w-3.5 h-3.5" />,
  'admin.landing_page_updated': <Globe className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  auth:    { bg: 'var(--primary-50)',  text: 'var(--primary-700)',  dot: 'var(--primary-500)' },
  social:  { bg: 'var(--success-50)',  text: 'var(--success-700)',  dot: 'var(--success-500)' },
  content: { bg: 'var(--warning-50, #fffbeb)', text: 'var(--warning-700, #92400e)', dot: 'var(--warning-500, #f59e0b)' },
  admin:   { bg: 'var(--error-50)',    text: 'var(--error-700)',    dot: 'var(--error-500)' },
};

const ALL_EVENTS = [
  'user.signup', 'user.email_verified',
  'couple.linked', 'couple.unlinked',
  'devotional.completed',
  'prayer.created', 'prayer.answered',
  'journal.created', 'qa.answered', 'mood.logged', 'profile.updated',
  'admin.privilege_granted', 'admin.privilege_revoked',
  'admin.devotional_created', 'admin.devotional_updated', 'admin.devotional_deleted',
  'admin.question_created', 'admin.question_updated', 'admin.question_deleted',
  'admin.module_created', 'admin.module_updated', 'admin.module_deleted',
  'admin.group_created', 'admin.group_updated', 'admin.group_deleted',
  'admin.user_deleted', 'admin.landing_page_updated',
];

const PAGE_SIZE = 25;

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

export function AuditLog({ accessToken }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState('');

  const [filterCategory, setFilterCategory] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [searchText, setSearchText] = useState('');

  const headers = { Authorization: `Bearer ${accessToken}` };

  const fetchLog = useCallback(async (pg = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pg * PAGE_SIZE) });
      if (filterCategory) params.set('category', filterCategory);
      if (filterEvent) params.set('event', filterEvent);
      if (filterUserId.trim()) params.set('userId', filterUserId.trim());

      const res = await fetch(`${BASE}/admin/audit-log?${params}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }

      setEntries(data.entries || []);
      setTotal(data.total || 0);
      setPage(pg);
    } catch (e: any) {
      setError(e.message || 'Network error — could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterCategory, filterEvent, filterUserId]);

  useEffect(() => { fetchLog(0); }, [fetchLog]);

  const handleTestWrite = async () => {
    setTestLoading(true);
    setTestMsg('');
    try {
      // Call any endpoint that triggers logAudit — use profile update as a safe test
      const res = await fetch(`${BASE}/profile`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ _auditTest: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestMsg('Test action sent. Refreshing log…');
        setTimeout(() => fetchLog(0), 1500);
      } else {
        setTestMsg(`Test failed: ${data.error || res.status}`);
      }
    } catch (e: any) {
      setTestMsg(`Test error: ${e.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  const filtered = searchText.trim()
    ? entries.filter(e =>
        e.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
        e.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
        e.event?.includes(searchText.toLowerCase())
      )
    : entries;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <Shield className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary-500)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>System Audit Log</h2>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
          {total} events
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleTestWrite}
            disabled={testLoading}
            title="Trigger a test profile update to verify logging is working"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-opacity disabled:opacity-50"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Test
          </button>
          <button
            onClick={() => fetchLog(page)}
            disabled={loading}
            className="p-2 rounded-lg"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {testMsg && (
        <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
          {testMsg}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            type="text"
            placeholder="Search name or event…"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg"
            style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); fetchLog(0); }}
          className="py-1.5 px-2 text-sm rounded-lg"
          style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All categories</option>
          <option value="auth">Auth</option>
          <option value="social">Social</option>
          <option value="content">Content</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={filterEvent}
          onChange={e => { setFilterEvent(e.target.value); fetchLog(0); }}
          className="py-1.5 px-2 text-sm rounded-lg"
          style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All events</option>
          {ALL_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <input
          type="text"
          placeholder="Filter by user ID…"
          value={filterUserId}
          onChange={e => setFilterUserId(e.target.value)}
          className="py-1.5 px-3 text-sm rounded-lg"
          style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'var(--error-50)', border: '1px solid var(--error-200, #fecaca)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--error-500)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--error-700)' }}>Could not load audit log</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--error-600)' }}>{error}</p>
          </div>
          <button onClick={() => fetchLog(0)} className="ml-auto text-xs underline" style={{ color: 'var(--error-600)' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading audit events…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Shield className="w-8 h-8 mx-auto opacity-30" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>No audit events yet</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Events appear here after admin or user actions.<br />
              Use the <strong>Test</strong> button above to verify logging is active.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {['Event', 'User', 'Details', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => {
                  const colors = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.content;
                  return (
                    <tr
                      key={entry.id}
                      style={{
                        background: i % 2 === 0 ? 'var(--background)' : 'var(--muted)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {/* Event */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                            style={{ background: colors.bg, color: colors.dot }}>
                            {EVENT_ICONS[entry.event] || <Shield className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div className="font-medium text-xs leading-tight" style={{ color: 'var(--foreground)' }}>
                              {entry.event}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5"
                              style={{ background: colors.bg, color: colors.text, fontSize: '10px' }}>
                              {entry.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs" style={{ color: 'var(--foreground)' }}>{entry.userName || '—'}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {entry.userEmail || (entry.userId ? entry.userId.slice(0, 12) + '…' : '—')}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {Object.entries(entry.metadata || {}).map(([k, v]) => (
                            <span key={k} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              <span style={{ color: 'var(--foreground)' }}>{k}:</span>{' '}
                              <span className="font-medium">{String(v).slice(0, 50)}</span>
                            </span>
                          ))}
                          {Object.keys(entry.metadata || {}).length === 0 && (
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>Page {page + 1} of {totalPages} · {total} total</span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLog(page - 1)}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchLog(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg disabled:opacity-40"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
