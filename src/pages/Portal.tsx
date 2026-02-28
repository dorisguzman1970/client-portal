import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Welcome from './Welcome';
import Users from './Users';
import Clients from './Clients';
import Buildings from './Buildings';
import Documents from './Documents';
import ParametersPage from './Parameters';
import type { AuthInfo } from '../types';

type Page = 'welcome' | 'users' | 'clients' | 'buildings' | 'documents' | 'parameters';

interface PortalProps {
  authInfo: AuthInfo;
  onLogout: () => void;
}

export default function Portal({ authInfo, onLogout }: PortalProps) {
  const [active, setActive] = useState<Page>('welcome');
  // State for non-admin user creation flow: auto-open client form
  const [pendingClientUserId, setPendingClientUserId] = useState<number | null>(null);

  function handleUserCreatedNonAdmin(userId: number) {
    setPendingClientUserId(userId);
    setActive('clients');
  }

  function handlePrefilledHandled() {
    setPendingClientUserId(null);
  }

  return (
    <div className="portal-layout">
      <Sidebar authInfo={authInfo} active={active} onSelect={setActive} onLogout={onLogout} />
      <main className="portal-content">
        {active === 'welcome' && <Welcome authInfo={authInfo} />}
        {active === 'users' && (
          <Users authInfo={authInfo} onUserCreatedNonAdmin={handleUserCreatedNonAdmin} />
        )}
        {active === 'clients' && (
          <Clients
            authInfo={authInfo}
            prefilledUserId={pendingClientUserId}
            onPrefilledHandled={handlePrefilledHandled}
          />
        )}
        {active === 'buildings' && <Buildings authInfo={authInfo} />}
        {active === 'documents' && <Documents authInfo={authInfo} />}
        {active === 'parameters' && <ParametersPage authInfo={authInfo} />}
      </main>
    </div>
  );
}
