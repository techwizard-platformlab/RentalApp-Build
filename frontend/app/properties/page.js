'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

export default function PropertiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/properties/', fetcher);
  const list = data?.results ?? data ?? [];

  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) ||
    p.state?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell title="Properties">
      <div className="page-header">
        <h1>Properties</h1>
        <p>All residential, commercial, and mixed-use properties</p>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="property-search"
            type="text"
            placeholder="Search by name, city, or state…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-stat" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <h3>No properties found</h3>
          <p>{search ? 'Try a different search' : 'Add your first property via the admin panel'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card" style={{ cursor: 'default' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44,
                    background: p.property_type === 'residential' ? 'rgba(34,211,238,0.12)' : p.property_type === 'commercial' ? 'rgba(99,102,241,0.12)' : 'rgba(52,211,153,0.12)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {p.property_type === 'residential' ? '🏠' : p.property_type === 'commercial' ? '🏢' : '🏗️'}
                  </div>
                  <span className={`badge ${p.property_type}`}>{p.property_type}</span>
                </div>
                <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  📍 {p.address_line_1}{p.address_line_2 ? `, ${p.address_line_2}` : ''}<br />
                  {p.city}, {p.state} — {p.postal_code}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                    🌍 {p.country}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
