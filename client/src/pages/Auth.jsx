import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api, errorMessage } from '../services/api';
import { useAuth } from '../contexts/Auth';
import { resetSocket } from '../services/socket';
export default function Auth({ register = false }) {
  const { setUser } = useAuth(),
    navigate = useNavigate(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [show, setShow] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError('');
    try {
      const r = await api.post(`/auth/${register ? 'register' : 'login'}`, values);
      resetSocket();
      setUser(r.data.data);
      navigate('/profile');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <Gamepad2 size={44} />
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>{register ? 'Make your mark.' : 'Welcome back, rival.'}</h1>
        <p>
          {register
            ? 'Save your victories. Build your rivalry.'
            : 'Your arena is right where you left it.'}
        </p>
      </div>
      <form className="panel auth-form" onSubmit={submit}>
        <h2>{register ? 'Join the arena' : 'Log in'}</h2>
        {error && (
          <div role="alert" className="inline-error">
            {error}
          </div>
        )}
        {register ? (
          <>
            <label>
              Username
              <input
                name="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[A-Za-z0-9_]+"
                placeholder="Your arena name"
                autoComplete="username"
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                maxLength={254}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </>
        ) : (
          <label>
            Email or username
            <input
              name="identifier"
              required
              placeholder="Your email or arena name"
              autoComplete="username"
            />
          </label>
        )}
        <label>
          Password
          <div className="password-field">
            <input
              name="password"
              type={show ? 'text' : 'password'}
              minLength={register ? 8 : 1}
              maxLength={72}
              required
              placeholder={register ? 'At least 8 characters' : 'Enter your password'}
              autoComplete={register ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {register && (
          <label>
            Confirm password
            <input
              name="confirmPassword"
              type={show ? 'text' : 'password'}
              required
              maxLength={72}
              autoComplete="new-password"
              placeholder="One more time"
            />
          </label>
        )}
        <button className="button" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create account' : 'Log in'}
          <ArrowRight size={17} />
        </button>
        <p>
          {register ? 'Already a player?' : 'New to the arena?'}{' '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Log in' : 'Create an account'}
          </Link>
        </p>
        <Link className="guest-link" to="/">
          Or jump in as a guest →
        </Link>
      </form>
    </div>
  );
}
