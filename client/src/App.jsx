import { lazy, Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/Auth';
import Layout from './components/layout/Layout';
import { ErrorPanel } from './components/common/UI';
import Home from './pages/Home';
const Details = lazy(() => import('./pages/Details'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
import NotFound from './pages/NotFound';
const Local = lazy(() => import('./pages/Local')),
  Online = lazy(() => import('./pages/Online'));
class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <ErrorPanel
        message="The arena hit an unexpected error. Reload to reconnect."
        retry={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <Boundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="games/:gameId" element={<Details />} />
              <Route path="play/:gameId/local" element={<Local />} />
              <Route path="play/:gameId/online" element={<Online />} />
              <Route path="room/:roomCode" element={<Online />} />
              <Route path="login" element={<Auth key="login" />} />
              <Route path="register" element={<Auth key="register" register />} />
              <Route path="profile" element={<Profile />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </Boundary>
  );
}
