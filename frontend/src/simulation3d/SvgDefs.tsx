import React from 'react';
import type { AnomalySimulation } from '../types';

interface SvgDefsProps {
  simulation: AnomalySimulation;
}

export const SVG_DEFS: React.FC<SvgDefsProps> = ({ simulation }) => (
  <defs>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0d9488" stopOpacity="0.6" />
      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
    </linearGradient>

    <linearGradient id="coagulateWaterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      {simulation.active && simulation.type === 'dosing_abnormal' && simulation.step < 7 ? (
        <>
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.75" />
          <stop offset="40%" stopColor="#b45309" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.2" />
        </>
      ) : (
        <>
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#0d9488" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0.2" />
        </>
      )}
    </linearGradient>

    <linearGradient id="clarifierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
      <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.15" />
    </linearGradient>

    <linearGradient id="roGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
      <stop offset="70%" stopColor="#059669" stopOpacity="0.35" />
      <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
    </linearGradient>

    <linearGradient id="tankBodyShading" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#1f2937" />
      <stop offset="30%" stopColor="#374151" />
      <stop offset="70%" stopColor="#111827" />
      <stop offset="100%" stopColor="#030712" />
    </linearGradient>

    <linearGradient id="goldTankShading" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#78350f" />
      <stop offset="30%" stopColor="#b45309" />
      <stop offset="70%" stopColor="#451a03" />
      <stop offset="100%" stopColor="#0f0500" />
    </linearGradient>

    <linearGradient id="steelColumnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#475569" />
      <stop offset="25%" stopColor="#94a3b8" />
      <stop offset="60%" stopColor="#334155" />
      <stop offset="100%" stopColor="#1e293b" />
    </linearGradient>

    <linearGradient id="hudHeaderGrad" x1="0%" y1="0%" x2="10%" y2="100%">
      <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
    </linearGradient>

    <linearGradient id="glassFacet" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <radialGradient id="hologramCircle" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
      <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
    </radialGradient>
  </defs>
);
