'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

export default function DepositsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/deposit-ledger/', fetcher);
  const list = data?.results ?? data ?? [];

  const totalReceived = list.filter(l => l.entry_type === 'received').reduce((s, l) => s + parseFloat(l.amount || 0), 0);
  const totalRefunded = list.filter(l => l.entry_type === 'refunded').reduce((s, l) => s + parseFloat(l.amount || 0), 0);
  const totalAdjusted = list.filter(l => l.entry_type === 'adjusted').reduce((s, l) => s + parseFloat(l.amount || 0), 0);

  const filtered = list.filter(l => {
    const matchType = typeFilter === 'all' || l.entry_type === typeFilter;
    const matchSearch = !search || JSON.stringify(l).toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const entryColors = { received: '#34d399', refunded: '#f87171', adjusted: '#fbbf24' };

  return (
    <AppShell title="Deposit Ledger">
      <div className="page-header">
        <h1>Deposit Ledger</h1>
        <p>Track security deposits — received, adjusted, and refunded</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>📥</div>
          </div>
          <div className="stat-value">₹{totalReceived.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Received</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>⚖️</div>
          </div>
          <div className="stat-value">₹{totalAdjusted.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Adjusted</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(248,113,113,0.12)' }}>📤</div>
          </div>
          <div className="stat-value">₹{totalRefunded.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Refunded</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>💼</div>
          </div>
          <div className="stat-value">₹{(totalReceived - totalRefunded - totalAdjusted).toLocaleString('en-IN')}</div>
          <div className="stat-label">Net Held</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input id="deposit-search" type="text" placeholder="Search deposits…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="deposit-filter-type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All types</option>
          <option value="received">Received</option>
          <option value="adjusted">Adjusted</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Deposit Entries <span className="text-muted text-sm">({filtered.length})</span></h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>No deposit entries</h3>
              <p>No deposit records found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Tenant</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Linked Tx</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td className="text-sm text-muted">{l.date}</td>
                    <td className="fw-600">{l.tenant_display ?? `#${l.tenant}`}</td>
                    <td>
                      <span className="badge" style={{
                        background: `${entryColors[l.entry_type]}18`,
                        color: entryColors[l.entry_type],
                      }}>
                        {l.entry_type}
                      </span>
                    </td>
                    <td className="fw-600">₹{parseFloat(l.amount).toLocaleString('en-IN')}</td>
                    <td className="text-sm text-muted">{l.reason || '—'}</td>
                    <td className="text-sm text-muted">{l.linked_transaction ?? '—'}</td>
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
