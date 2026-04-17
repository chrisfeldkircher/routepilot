import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DocsPage } from './pages/DocsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/docs" element={<DocsPage />} />
    </Routes>
  );
}
