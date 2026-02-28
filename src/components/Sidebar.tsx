import type { AuthInfo } from '../types';

type Page = 'welcome' | 'users' | 'clients' | 'buildings' | 'documents' | 'parameters';

interface SidebarProps {
  authInfo: AuthInfo;
  active: Page;
  onSelect: (page: Page) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { key: Page; label: string; adminOnly?: boolean }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'users', label: 'Users', adminOnly: true },
  { key: 'clients', label: 'Clients' },
  { key: 'buildings', label: 'Buildings' },
  { key: 'documents', label: 'Documents' },
  { key: 'parameters', label: 'Parameters', adminOnly: true },
];

export default function Sidebar({ authInfo, active, onSelect, onLogout }: SidebarProps) {
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || authInfo.userAdmin);

  return (
    <nav className="sidebar">
      <div className="sidebar-user">
        <div className="sidebar-username">{authInfo.userName}</div>
        <div className="sidebar-email">{authInfo.userEmail}</div>
        {authInfo.userAdmin && <span className="badge badge-admin">Admin</span>}
      </div>

      <div className="sidebar-nav">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            className={`sidebar-btn${active === item.key ? ' active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-secondary sidebar-btn" onClick={onLogout}>Sign Out</button>
      </div>
    </nav>
  );
}
