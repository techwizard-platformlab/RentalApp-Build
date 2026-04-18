'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AppShell from '@/components/AppShell';
import useSWR from 'swr';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const fetcher = (path) => api.get(path);

// ── Custom recharts tooltip ───────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,36,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#f1f5f9', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? `₹${p.value.toLocaleString('en-IN')}` : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Stat card ─────────────────────────────────────────────
const StatCard = ({ icon, label, value, badge, badgeType, color }) => (
  <div className="stat-card" style={{ '--gradient-color': color }}>
    <div className="stat-card-header">
      <div className="stat-icon" style={{ background: `${color}18` }}>
        <span>{icon}</span>
      </div>
      {badge && <span className={`stat-badge ${badgeType}`}>{badge}</span>}
    </div>
    <div className="stat-value">{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// ── Skeleton row ──────────────────────────────────────────
const SkeletonStats = () => (
  <div className="stats-grid">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="skeleton skeleton-stat" />
    ))}
  </div>
);

const PIE_COLORS = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24'];

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data: properties, isLoading: pLoad } = useSWR('v1/properties/', fetcher);
  const { data: units,      isLoading: uLoad } = useSWR('v1/units/', fetcher);
  const { data: tenants,    isLoading: tLoad } = useSWR('v1/tenants/', fetcher);
  const { data: rentLedger, isLoading: lLoad } = useSWR('v1/rent-ledger/', fetcher);
  const { data: transactions }                  = useSWR('v1/transactions/', fetcher);

  const isLoading = pLoad || uLoad || tLoad || lLoad;

  // ── Derived stats ─────────────────────────────────────
  const propList = properties?.results ?? properties ?? [];
  const unitList = units?.results ?? units ?? [];
  const tenantList = tenants?.results ?? tenants ?? [];
  const ledgerList = rentLedger?.results ?? rentLedger ?? [];
  const txList = transactions?.results ?? transactions ?? [];

  const totalProperties = propList.length;
  const totalUnits      = unitList.length;
  const occupiedUnits   = unitList.filter(u => u.status === 'occupied').length;
  const vacantUnits     = unitList.filter(u => u.status === 'vacant').length;
  const activeTenants   = tenantList.filter(t => t.status === 'active').length;
  const overdueLedger   = ledgerList.filter(l => l.status === 'overdue').length;

  const totalIncome = txList
    .filter(t => t.transaction_type === 'income')
    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  const occupancyPct = totalUnits ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // ── Chart data ────────────────────────────────────────

  // Unit status pie
  const statusPie = [
    { name: 'Occupied',    value: occupiedUnits },
    { name: 'Vacant',      value: vacantUnits },
    { name: 'Maintenance', value: unitList.filter(u => u.status === 'maintenance').length },
  ].filter(d => d.value > 0);

  // Ledger status breakdown bar
  const ledgerBreakdown = [
    { status: 'Paid',    count: ledgerList.filter(l => l.status === 'paid').length },
    { status: 'Pending', count: ledgerList.filter(l => l.status === 'pending').length },
    { status: 'Overdue', count: ledgerList.filter(l => l.status === 'overdue').length },
    { status: 'Partial', count: ledgerList.filter(l => l.status === 'partial').length },
  ].filter(d => d.count > 0);

  // Monthly income area chart
  const monthlyIncome = (() => {
    const map = {};
    txList
      .filter(t => t.transaction_type === 'income')
      .forEach(t => {
        const date = new Date(t.transaction_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + parseFloat(t.amount || 0);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, income]) => ({ month: month.slice(5), income: Math.round(income) }));
  })();

  // Recent tenants
  const recentTenants = [...tenantList]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <AppShell title="Dashboard">
      <div className="page-header">
        <h1>Overview</h1>
        <p>Your property portfolio at a glance</p>
      </div>

      {/* Stats */}
      {isLoading ? <SkeletonStats /> : (
        <div className="stats-grid">
          <StatCard icon="🏢" label="Total Properties" value={totalProperties}
            badge={`${totalProperties} active`} badgeType="neutral" color="#6366f1" />
          <StatCard icon="🚪" label="Total Units"     value={totalUnits}
            badge={`${occupancyPct}% occupied`} badgeType={occupancyPct > 70 ? 'up' : 'neutral'} color="#22d3ee" />
          <StatCard icon="🟢" label="Occupied"         value={occupiedUnits}
            badge="units" badgeType="up" color="#34d399" />
          <StatCard icon="🔑" label="Vacant"           value={vacantUnits}
            badge="available" badgeType="neutral" color="#fbbf24" />
          <StatCard icon="👥" label="Active Tenants"   value={activeTenants}
            badge={overdueLedger > 0 ? `${overdueLedger} overdue` : 'all clear'} badgeType={overdueLedger > 0 ? 'down' : 'up'} color="#6366f1" />
          <StatCard icon="💰" label="Total Income"     value={`₹${totalIncome.toLocaleString('en-IN')}`}
            badge="all time" badgeType="up" color="#34d399" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid-2 mb-24">
        {/* Monthly income area chart */}
        <div className="card">
          <div className="card-header">
            <h3>Monthly Income</h3>
            <span className="text-xs text-muted">Last 6 months</span>
          </div>
          <div className="card-body">
            {monthlyIncome.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📊</div>
                <p>No transaction data yet</p>
              </div>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyIncome}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" strokeWidth={2} fill="url(#incomeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Unit status pie */}
        <div className="card">
          <div className="card-header">
            <h3>Unit Status</h3>
            <span className="text-xs text-muted">{totalUnits} total units</span>
          </div>
          <div className="card-body">
            {statusPie.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">🚪</div>
                <p>No units yet</p>
              </div>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                      paddingAngle={3} dataKey="value">
                      {statusPie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid-2">
        {/* Ledger status bar chart */}
        <div className="card">
          <div className="card-header">
            <h3>Rent Ledger Status</h3>
          </div>
          <div className="card-body">
            {ledgerBreakdown.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📒</div>
                <p>No ledger entries yet</p>
              </div>
            ) : (
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ledgerBreakdown} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="status" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Entries" radius={[4, 4, 0, 0]}>
                      {ledgerBreakdown.map((entry, i) => {
                        const colors = { Paid: '#34d399', Pending: '#fbbf24', Overdue: '#f87171', Partial: '#6366f1' };
                        return <Cell key={i} fill={colors[entry.status] || '#6366f1'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent tenants */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Tenants</h3>
            <a href="/tenants" style={{ fontSize: '0.8125rem', color: 'var(--accent-primary)' }}>View all →</a>
          </div>
          <div className="table-wrap">
            {recentTenants.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">👥</div>
                <p>No tenants yet</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTenants.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.display_name}</td>
                      <td><span className={`badge ${t.tenant_type}`}>{t.tenant_type}</span></td>
                      <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                      <td className="text-accent fw-600">₹{parseFloat(t.rent_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
