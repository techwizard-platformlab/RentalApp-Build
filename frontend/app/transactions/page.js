'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = p => api.get(p);

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    if (!api.isAuthenticated()) router.replace('/login');
  }, [router]);

  const { data, isLoading } = useSWR('v1/transactions/', fetcher);
  const list = data?.results ?? data ?? [];

  const totalIncome  = list.filter(t => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = list.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  // Unique categories
  const categories = [...new Set(list.map(t => t.category))].sort();

  const filtered = list.filter(t => {
    const matchType = typeFilter === 'all' || t.transaction_type === typeFilter;
    const matchCat  = catFilter === 'all'  || t.category === catFilter;
    const matchSearch = !search ||
      t.notes?.toLowerCase().includes(search.toLowerCase()) ||
      t.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.payment_mode?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchCat && matchSearch;
  });

  return (
    <AppShell title="Transactions">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>All income and expense records across properties</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>📈</div>
            <span className="stat-badge up">income</span>
          </div>
          <div className="stat-value">₹{totalIncome.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Income</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(248,113,113,0.12)' }}>📉</div>
            <span className="stat-badge down">expense</span>
          </div>
          <div className="stat-value">₹{totalExpense.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>💼</div>
            <span className={`stat-badge ${totalIncome - totalExpense >= 0 ? 'up' : 'down'}`}>net</span>
          </div>
          <div className="stat-value" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
            ₹{Math.abs(totalIncome - totalExpense).toLocaleString('en-IN')}
          </div>
          <div className="stat-label">Net {totalIncome - totalExpense >= 0 ? 'Profit' : 'Loss'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>🗂️</div>
          </div>
          <div className="stat-value">{list.length}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input id="tx-search" type="text" placeholder="Search notes, reference, mode…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="tx-filter-type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select id="tx-filter-cat" value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ width: 'auto', flexShrink: 0 }}>
          <option value="all">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Transactions <span className="text-muted text-sm">({filtered.length})</span></h3>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💳</div>
              <h3>No transactions</h3>
              <p>No transaction records found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Paid By</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td className="text-sm text-muted">{t.transaction_date}</td>
                    <td>
                      <span className="badge" style={{
                        background: t.transaction_type === 'income' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                        color: t.transaction_type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)',
                      }}>
                        {t.transaction_type === 'income' ? '↑' : '↓'} {t.transaction_type}
                      </span>
                    </td>
                    <td className="text-sm">{t.category}</td>
                    <td className="fw-600" style={{ color: t.transaction_type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {t.currency} {parseFloat(t.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="text-sm text-muted">{t.paid_by}</td>
                    <td className="text-sm text-muted">{t.payment_mode || '—'}</td>
                    <td className="text-sm text-muted">{t.reference_number || '—'}</td>
                    <td className="text-xs text-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.notes || '—'}
                    </td>
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
