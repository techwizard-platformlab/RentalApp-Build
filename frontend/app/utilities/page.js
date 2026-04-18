'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

const UTILITY_ICONS = { eb: '⚡', water: '💧', gas: '🔥', common_area: '🏛️' };

export default function UtilitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/utilities/', fetcher);
  const list = data?.results ?? data ?? [];

  const totalBilled = list.reduce((s, u) => s + parseFloat(u.bill_amount || 0), 0);
  const totalPaid   = list.reduce((s, u) => s + parseFloat(u.paid_amount || 0), 0);
  const pending     = list.filter(u => u.payment_status === 'pending').length;

  const filtered = list.filter(u => {
    const matchType   = typeFilter === 'all'   || u.utility_type === typeFilter;
    const matchStatus = statusFilter === 'all' || u.payment_status === statusFilter;
    const matchSearch = !search || u.meter_number?.includes(search);
    return matchType && matchStatus && matchSearch;
  });

  return (
    <AppShell title="Utilities">
      <div className="page-header">
        <h1>Utilities</h1>
        <p>Electricity, water, gas, and common area billing</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>🧾</div>
          </div>
          <div className="stat-value">₹{totalBilled.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Billed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>✅</div>
          </div>
          <div className="stat-value">₹{totalPaid.toLocaleString('en-IN')}</div>
          <div className="stat-label">Collected</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(248,113,113,0.12)' }}>⚠️</div>
          </div>
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending Bills</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>📊</div>
          </div>
          <div className="stat-value">{list.length}</div>
          <div className="stat-label">Total Records</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input id="utility-search" type="text" placeholder="Search by meter number…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="utility-filter-type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All utilities</option>
          <option value="eb">Electricity</option>
          <option value="water">Water</option>
          <option value="gas">Gas</option>
          <option value="common_area">Common Area</option>
        </select>
        <select id="utility-filter-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Utility Records <span className="text-muted text-sm">({filtered.length})</span></h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚡</div>
              <h3>No utility records</h3>
              <p>No utility billing records found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Meter No.</th>
                  <th>Model</th>
                  <th>Consumption</th>
                  <th>Rate</th>
                  <th>Bill</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <span style={{ fontSize: '1.1rem', marginRight: 6 }}>
                        {UTILITY_ICONS[u.utility_type] || '🔌'}
                      </span>
                      <span className="text-sm fw-600">{u.utility_type === 'eb' ? 'Electricity' : u.utility_type}</span>
                    </td>
                    <td className="text-xs text-muted">{u.billing_period_start} → {u.billing_period_end}</td>
                    <td className="text-sm text-muted">{u.meter_number || '—'}</td>
                    <td><span className={`badge ${u.billing_model}`}>{u.billing_model}</span></td>
                    <td className="text-sm">{u.consumption_units} units</td>
                    <td className="text-sm text-muted">₹{u.rate_per_unit}/unit</td>
                    <td className="fw-600">₹{parseFloat(u.bill_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-success">₹{parseFloat(u.paid_amount || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${u.payment_status}`}>{u.payment_status}</span></td>
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
