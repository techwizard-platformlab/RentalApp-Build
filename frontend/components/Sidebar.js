'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

const navItems = [
  { section: 'Overview' },
  { href: '/',           icon: '⬡',  label: 'Dashboard'   },
  { section: 'Properties' },
  { href: '/properties', icon: '🏢',  label: 'Properties'  },
  { href: '/units',      icon: '🚪',  label: 'Units'       },
  { section: 'People' },
  { href: '/tenants',    icon: '👥',  label: 'Tenants'     },
  { section: 'Finance' },
  { href: '/ledger',     icon: '📒',  label: 'Rent Ledger' },
  { href: '/deposits',   icon: '💰',  label: 'Deposits'    },
  { href: '/transactions', icon: '💳', label: 'Transactions' },
  { section: 'Utilities' },
  { href: '/utilities',  icon: '⚡',  label: 'Utilities'   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
  };

  const user = api.getUser();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏠</div>
        <span className="sidebar-logo-text">RentalApp</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="nav-section-label">{item.section}</div>;
          }
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
          }}>
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.username || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user?.role || 'Owner'}
            </div>
          </div>
        </div>
        <button
          id="btn-logout"
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', padding: '8px', fontSize: '0.8125rem' }}
        >
          ↩ Sign out
        </button>
      </div>
    </aside>
  );
}
