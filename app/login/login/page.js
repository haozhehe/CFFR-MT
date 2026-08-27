export default function LoginPage() {
  return (
    <div className="login-panel">
      <div className="login-title">Sign in</div>
      <p className="login-subtitle">Welcome back</p>

      <form className="login-form">
        <label>
          <span className="field-label">Email</span>
          <input type="email" name="email" />
        </label>

        <label>
          <span className="field-label">Password</span>
          <input type="password" name="password" />
        </label>

        <label>
          <span className="field-label">Username</span>
          <input type="text" name="username" />
        </label>

        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
}