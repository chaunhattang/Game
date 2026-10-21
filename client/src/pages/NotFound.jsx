import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="empty not-found">
      <span className="eyebrow">404 · OUT OF BOUNDS</span>
      <h1>This arena doesn’t exist.</h1>
      <p>Head back and pick your next game.</p>
      <Link to="/" className="button">
        Back to the arena
      </Link>
    </div>
  );
}
