import DashboardPage from '../pages/DashboardPage';
<<<<<<< HEAD
import AnimationPreview from '../simulation3d/AnimationPreview';

export default function App() {
  return (
    <div
      className="relative min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-teal-500/30 selection:text-white"
      id="root-viewport"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.06),transparent_60%)] z-0" id="bg-ambient-layer-1" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:48px_48px] z-0 opacity-40" id="bg-ambient-layer-2" />
      <DashboardPage />
      <AnimationPreview />
    </div>
=======
import { ErrorBoundary } from './ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div
        className="relative min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-teal-500/30 selection:text-white"
        id="root-viewport"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.06),transparent_60%)] z-0" id="bg-ambient-layer-1" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:48px_48px] z-0 opacity-40" id="bg-ambient-layer-2" />
        <DashboardPage />
      </div>
    </ErrorBoundary>
>>>>>>> 10a5e79a358f4b21611c9d6b668a7659677b5628
  );
}
