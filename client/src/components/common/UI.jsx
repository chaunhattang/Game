import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
export function Loading() {
  return (
    <div className="loading" role="status">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <span>Loading the arena…</span>
    </div>
  );
}
export function ErrorPanel({ message, retry }) {
  return (
    <div className="empty error">
      <AlertTriangle />
      <h3>Something needs attention</h3>
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Back() {
  return (
    <Link className="back-link" to="/">
      <ArrowLeft size={16} /> Back to games
    </Link>
  );
}
export function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  );
}
