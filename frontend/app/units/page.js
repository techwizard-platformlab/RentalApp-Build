'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

export default function UnitsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/units/', fetcher);
  const list = data?.results ?? data ?? [];
  const { data: propData } = useSWR('v1/properties/', fetcher);
  const propMap = {};
  (propData?.results ?? propData ?? []).forEach(p => { propMap[p.id] = p.name; });

  const filtered = list.filter(u => {
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchType   = typeFilter === 'all'   || u.module_type === typeFilter;
    const matchSearch = !search
      || u.unit_code.toLowerCase().includes(search.toLowerCase())
      || propMap[u.property]?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  return (
    <AppShell title="Units">
      <div className="page-header">
        <h1>Units</h1>
        <p>All individual units across your properties</p>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input id="unit-search" type="text" placeholder="Search by unit code or property…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="unit-filter-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All statuses</option>
          <option value="occupied">Occupied</option>
          <option value="vacant">Vacant</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select id="unit-filter-type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Units <span className="text-muted text-sm">({filtered.length})</span></h3>
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
              <div className="empty-icon">🚪</div>
              <h3>No units found</h3>
              <p>Adjust your filters or add units via the admin panel</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Unit Code</th>
                  <th>Property</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Area (sqft)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="fw-600">{u.unit_code}</td>
                    <td className="text-sm">{propMap[u.property] ?? `#${u.property}`}</td>
                    <td><span className={`badge ${u.module_type}`}>{u.module_type}</span></td>
                    <td className="text-muted text-sm">{u.floor || '—'}</td>
                    <td className="text-sm">{u.area_sqft ? `${u.area_sqft} sqft` : '—'}</td>
                    <td><span className={`badge ${u.status}`}>{u.status}</span></td>
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
