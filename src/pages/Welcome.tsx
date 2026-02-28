import { useEffect, useState } from 'react';
import { getParameters } from '../api/parameters';
import type { AuthInfo, Parameters } from '../types';

interface WelcomeProps {
  authInfo: AuthInfo;
}

export default function Welcome({ authInfo }: WelcomeProps) {
  const [params, setParams] = useState<Parameters | null>(null);

  useEffect(() => {
    getParameters().then(setParams).catch(() => setParams(null));
  }, []);

  const companyName = params?.empName || 'Client Portal';
  const logoSrc = params?.empLogo ? `data:image/*;base64,${params.empLogo}` : null;

  return (
    <div className="welcome-page">
      {logoSrc && (
        <img src={logoSrc} alt="Company logo" className="company-logo" />
      )}
      <h1>{companyName}</h1>
      <p className="welcome-greeting">
        Welcome, <strong>{authInfo.userName}</strong>!
      </p>
      <p className="welcome-email">{authInfo.userEmail}</p>
      {authInfo.userAdmin && (
        <span className="badge badge-admin">Administrator</span>
      )}
    </div>
  );
}
