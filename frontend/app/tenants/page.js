'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

export default function TenantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/tenants/', fetcher);
  const list = data?.results ?? data ?? [];

  const filtered = list.filter(t => {
    const matchSearch = t.display_name.toLowerCase().includes(search.toLowerCase())
      || t.email?.toLowerCase().includes(search.toLowerCase())
      || t.phone?.includes(search);
    const matchFilter = filter === 'all' || t.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AppShell title="Tenants">
      <div className="page-header">
        <h1>Tenants</h1>
        <p>Manage all residential and commercial tenants</p>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="tenant-search"
            type="text"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select id="tenant-filter-status" value={filter} onChange={e => setFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exited">Exited</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>All Tenants <span className="text-muted text-sm">({filtered.length})</span></h3>
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
              <div className="empty-icon">👥</div>
              <h3>No tenants found</h3>
              <p>{search ? 'Try adjusting your search' : 'No tenants have been added yet'}</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Start Date</th>
                  <th>Rent</th>
                  <th>Deposit</th>
                  <th>Billing</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.display_name}</div>
                      {t.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</div>}
                    </td>
                    <td><span className={`badge ${t.tenant_type}`}>{t.tenant_type}</span></td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{t.phone || '—'}</div>
                      {t.whatsapp_number && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)' }}>📱 {t.whatsapp_number}</div>
                      )}
                    </td>
                    <td className="text-sm text-muted">{t.start_date}</td>
                    <td className="text-accent fw-600">₹{parseFloat(t.rent_amount).toLocaleString('en-IN')}</td>
                    <td className="text-sm">₹{parseFloat(t.deposit_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="text-sm text-muted">{t.billing_cycle}</td>
                    <td><span className={`badge ${t.status}`}>{t.status}</span></td>
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
