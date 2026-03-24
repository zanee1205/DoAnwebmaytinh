import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000/api";

async function api(path, options = {}) {
  const { token, body, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method: rest.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...rest,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Co loi xay ra khi goi API.");
  }

  return data;
}

function AuthForm({ mode, setMode, onLogin, onRegister, onReset, busy }) {
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [resetForm, setResetForm] = useState({
    username: "",
    phone: "",
    newPassword: "",
  });

  return (
    <section className="auth-layout">
      <div className="glass-panel">
        <div className="auth-banner-wrap">
          <img
            className="auth-banner-image"
            src="https://picsum.photos/seed/zanee-auth/1200/900"
            alt="Zanee auth"
          />
        </div>
      </div>

      <div className="glass-panel">
        <span className="eyebrow">Tai khoan Zanee.Store</span>
        <h2 className="auth-welcome">Chao mung ban quay lai!</h2>
        <p className="auth-subtext">
          Project copy nay chi giu giao dien dang nhap, dang ky va logic auth lien quan.
        </p>

        {mode === "login" && (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin(loginForm);
            }}
          >
            <input
              className="form-control"
              placeholder="Username"
              value={loginForm.username}
              onChange={(event) =>
                setLoginForm({ ...loginForm, username: event.target.value })
              }
            />
            <input
              className="form-control"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm({ ...loginForm, password: event.target.value })
              }
            />
            <div className="auth-action-row">
              <button className="btn btn-primary auth-submit-btn" disabled={busy}>
                Dang nhap
              </button>
              <button
                type="button"
                className="btn btn-link auth-inline-link"
                onClick={() => setMode("register")}
              >
                Ban chua co tai khoan? Dang ky ngay!
              </button>
            </div>
            <button
              type="button"
              className="btn btn-link auth-forgot-link"
              onClick={() => setMode("reset")}
            >
              Quen mat khau
            </button>
          </form>
        )}

        {mode === "register" && (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              onRegister(registerForm);
            }}
          >
            <input
              className="form-control"
              placeholder="Username"
              value={registerForm.username}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, username: event.target.value })
              }
            />
            <input
              className="form-control"
              placeholder="Email"
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, email: event.target.value })
              }
            />
            <input
              className="form-control"
              placeholder="So dien thoai"
              value={registerForm.phone}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, phone: event.target.value })
              }
            />
            <input
              className="form-control"
              type="password"
              placeholder="Mat khau"
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
            />
            <div className="auth-action-row">
              <button className="btn btn-primary auth-submit-btn" disabled={busy}>
                Tao tai khoan
              </button>
              <button
                type="button"
                className="btn btn-link auth-inline-link"
                onClick={() => setMode("login")}
              >
                Da co tai khoan? Dang nhap ngay!
              </button>
            </div>
            <button
              type="button"
              className="btn btn-link auth-forgot-link"
              onClick={() => setMode("reset")}
            >
              Quen mat khau
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              onReset(resetForm);
            }}
          >
            <input
              className="form-control"
              placeholder="Username da dang ky"
              value={resetForm.username}
              onChange={(event) =>
                setResetForm({ ...resetForm, username: event.target.value })
              }
            />
            <input
              className="form-control"
              placeholder="So dien thoai da dang ky"
              value={resetForm.phone}
              onChange={(event) =>
                setResetForm({ ...resetForm, phone: event.target.value })
              }
            />
            <input
              className="form-control"
              type="password"
              placeholder="Mat khau moi"
              value={resetForm.newPassword}
              onChange={(event) =>
                setResetForm({ ...resetForm, newPassword: event.target.value })
              }
            />
            <div className="auth-action-row">
              <button className="btn btn-primary auth-submit-btn" disabled={busy}>
                Dat lai mat khau
              </button>
              <button
                type="button"
                className="btn btn-link auth-inline-link"
                onClick={() => setMode("login")}
              >
                Quay lai dang nhap
              </button>
            </div>
          </form>
        )}

        <div className="credentials-panel">
          <p className="mb-2">Tai khoan demo (tach tu project goc):</p>
          <ul>
            <li>admin / Admin@123</li>
            <li>minhdev / User@123</li>
            <li>blockeduser / Locked@123</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function ProfilePanel({ user, onLogout }) {
  return (
    <section className="glass-panel profile-panel">
      <span className="eyebrow">Dang nhap thanh cong</span>
      <h2 className="auth-welcome mb-3">Xin chao, {user.username}</h2>

      <div className="profile-grid">
        <div className="profile-item">
          <span>Role</span>
          <strong>{user.role}</strong>
        </div>
        <div className="profile-item">
          <span>Email</span>
          <strong>{user.email}</strong>
        </div>
        <div className="profile-item">
          <span>Phone</span>
          <strong>{user.phone}</strong>
        </div>
        <div className="profile-item">
          <span>Trang thai</span>
          <strong>{user.isLocked ? "Bi khoa" : "Hoat dong"}</strong>
        </div>
      </div>

      <button className="btn btn-info mt-4" onClick={onLogout}>
        Dang xuat
      </button>
    </section>
  );
}

function App() {
  const [mode, setMode] = useState("login");
  const [session, setSession] = useState({
    token: localStorage.getItem("zanee-copy-token") || "",
    user: null,
  });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!session.token) {
      return;
    }

    api("/me", { token: session.token })
      .then((data) => {
        setSession((current) => ({ ...current, user: data.user }));
      })
      .catch(() => {
        localStorage.removeItem("zanee-copy-token");
        setSession({ token: "", user: null });
      });
  }, [session.token]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const title = useMemo(() => {
    if (!session.user) {
      return "Auth only";
    }

    return session.user.role === "admin" ? "Admin session" : "User session";
  }, [session.user]);

  async function handleAuth(type, payload) {
    try {
      setBusy(true);
      const endpoint = type === "login" ? "/auth/login" : "/auth/register";
      const data = await api(endpoint, { method: "POST", body: payload });
      localStorage.setItem("zanee-copy-token", data.token);
      setSession({ token: data.token, user: data.user });
      setToast(type === "login" ? "Dang nhap thanh cong." : "Dang ky thanh cong.");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(payload) {
    try {
      setBusy(true);
      const data = await api("/auth/reset-password", {
        method: "POST",
        body: payload,
      });
      setToast(data.message);
      setMode("login");
    } catch (error) {
      setToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("zanee-copy-token");
    setSession({ token: "", user: null });
    setMode("login");
    setToast("Da dang xuat.");
  }

  return (
    <main className="app-shell">
      <div className="main-wrap">
        <header className="brand-row">
          <h1 className="brand">
            <span>Zanee.</span>Store copy
          </h1>
          <span className="badge text-bg-info">{title}</span>
        </header>

        {toast && <div className="alert alert-info">{toast}</div>}

        {session.user ? (
          <ProfilePanel user={session.user} onLogout={handleLogout} />
        ) : (
          <AuthForm
            mode={mode}
            setMode={setMode}
            onLogin={(payload) => handleAuth("login", payload)}
            onRegister={(payload) => handleAuth("register", payload)}
            onReset={handleReset}
            busy={busy}
          />
        )}
      </div>
    </main>
  );
}

export default App;
