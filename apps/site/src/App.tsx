import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { InteractiveDemo } from './components/InteractiveDemo';
import { KeyPillars } from './components/KeyPillars';
import { DevExperience } from './components/DevExperience';
import { Install } from './components/Install';
import { FrameworkSupport } from './components/FrameworkSupport';
import { UseCaseGrid } from './components/UseCaseGrid';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <InteractiveDemo />
        <KeyPillars />
        <DevExperience />
        <Install />
        <FrameworkSupport />
        <UseCaseGrid />
      </main>
      <Footer />
    </>
  );
}
