export function AuthScreen({
  email,
  password,
  warning,
  busy,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onRegister,
}: {
  email: string;
  password: string;
  warning: string;
  busy: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <main className="auth-screen theme-neo-cool">
      <section className="auth-panel">
        <h1>SparkTransClient</h1>
        <p>Secure dictation workspace</p>
        <label>
          Email
          <input value={email} onChange={(event) => onEmailChange(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} />
        </label>
        {warning && <div className="banner error">{warning}</div>}
        <div className="button-row">
          <button onClick={onLogin} disabled={Boolean(busy)}>Sign in</button>
          <button className="secondary" onClick={onRegister} disabled={Boolean(busy)}>Create account</button>
        </div>
      </section>
    </main>
  );
}
