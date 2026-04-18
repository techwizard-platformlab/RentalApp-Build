'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function LedgerPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/rent-ledger/', fetcher);
  const list = data?.results ?? data ?? [];

  // Summary stats
  const totalDue     = list.reduce((s, l) => s + parseFloat(l.due_amount || 0), 0);
  const totalPaid    = list.reduce((s, l) => s + parseFloat(l.paid_amount || 0), 0);
  const totalPending = list.reduce((s, l) => s + parseFloat(l.pending_amount || 0), 0);
  const overdueCount = list.filter(l => l.status === 'overdue').length;

  const filtered = list.filter(l => {
    const matchFilter = statusFilter === 'all' || l.status === statusFilter;
    const matchSearch = !search || JSON.stringify(l).toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <AppShell title="Rent Ledger">
      <div className="page-header">
        <h1>Rent Ledger</h1>
        <p>Track all rent due, paid, and outstanding balances</p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card" style={{ '--gradient-color': '#6366f1' }}>
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>📋</div>
          </div>
          <div className="stat-value">₹{totalDue.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Billed</div>
        </div>
        <div className="stat-card" style={{ '--gradient-color': '#34d399' }}>
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>✅</div>
          </div>
          <div className="stat-value">₹{totalPaid.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card" style={{ '--gradient-color': '#fbbf24' }}>
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>⏳</div>
          </div>
          <div className="stat-value">₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="stat-label">Outstanding</div>
        </div>
        <div className="stat-card" style={{ '--gradient-color': '#f87171' }}>
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(248,113,113,0.12)' }}>🚨</div>
          </div>
          <div className="stat-value">{overdueCount}</div>
          <div className="stat-label">Overdue Entries</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="ledger-search"
            type="text"
            placeholder="Search ledger…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select id="ledger-filter-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Ledger Entries <span className="text-muted text-sm">({filtered.length})</span></h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📒</div>
              <h3>No ledger entries</h3>
              <p>{search || statusFilter !== 'all' ? 'Try adjusting filters' : 'No rent ledger entries yet'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Tenant</th>
                  <th>Due Amount</th>
                  <th>Paid Amount</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td className="fw-600">
                      {MONTH_NAMES[l.period_month]} {l.period_year}
                    </td>
                    <td>{l.tenant_display ?? `#${l.tenant}`}</td>
                    <td className="fw-600">₹{parseFloat(l.due_amount).toLocaleString('en-IN')}</td>
                    <td className="text-success">₹{parseFloat(l.paid_amount || 0).toLocaleString('en-IN')}</td>
                    <td className={parseFloat(l.pending_amount || 0) > 0 ? 'text-warning fw-600' : 'text-muted'}>
                      ₹{parseFloat(l.pending_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                    <td className="text-xs text-muted">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
