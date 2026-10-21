import { Link, useParams } from 'react-router-dom';
import { Monitor, Globe, Keyboard, Users, ArrowRight } from 'lucide-react';
import { getGame } from '../../../shared/catalog';
import Artwork from '../components/common/Artwork';
import { Back } from '../components/common/UI';
import NotFound from './NotFound';
export default function Details() {
  const { gameId } = useParams(),
    g = getGame(gameId);
  if (!g) return <NotFound />;
  return (
    <>
      <Back />
      <div className="details-grid">
        <div className="details-art">
          <Artwork id={g.id} />
          <div className="detail-badges">
            <span className="pill">{g.category}</span>
            <span className="pill">{g.difficulty}</span>
            <span className="pill">
              <Users size={14} /> 2 players
            </span>
          </div>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">CHALLENGE ACCEPTED</span>
          <h1>{g.name}</h1>
          <p className="lead">{g.description}</p>
          <div className="play-options">
            <Link className="button" to={`/play/${g.id}/local`}>
              <Monitor size={18} /> Local play <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" to={`/play/${g.id}/online`}>
              <Globe size={18} /> Online play
            </Link>
          </div>
          <p className="muted">Play as a guest. Sign in to save online results.</p>
        </div>
      </div>
      <div className="instruction-grid">
        <div className="panel">
          <h3>How to win</h3>
          <p>{g.instructions}</p>
        </div>
        <div className="panel">
          <h3>
            <Keyboard size={18} /> The controls
          </h3>
          <p>{g.controls}</p>
          <p className="muted">On a phone? Use the board or on-screen controls.</p>
        </div>
      </div>
    </>
  );
}
