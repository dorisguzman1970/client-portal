import { useEffect, useState } from 'react';

interface Props {
  userEmail: string;
  onVerified: () => void;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return local.charAt(0) + '***@' + (domain || '');
}

export default function EmailVerification({ userEmail, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function sendCode() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/send-verification-code', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Error al enviar el código. Intente de nuevo.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.');
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    sendCode();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Ingrese el código de 6 dígitos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.verified) {
        onVerified();
      } else {
        setError(data.message || 'Código incorrecto.');
      }
    } catch {
      setError('Error de conexión. Intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="login-card">
        <h2>Verificación de identidad</h2>
        {sent ? (
          <p>
            Hemos enviado un código de 6 dígitos a{' '}
            <strong>{maskEmail(userEmail)}</strong>. Revise su bandeja de entrada.
          </p>
        ) : (
          <p>Enviando código...</p>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div className="form-group">
            <label htmlFor="otp-code">Código de verificación</label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4em' }}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 10 }}
            disabled={loading || sending || code.length !== 6}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%' }}
            disabled={sending}
            onClick={() => { setCode(''); setError(null); sendCode(); }}
          >
            {sending ? 'Enviando...' : 'Reenviar código'}
          </button>
        </form>
      </div>
    </div>
  );
}
