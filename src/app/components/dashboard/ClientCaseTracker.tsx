'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface Phase {
  name: string;
  status: 'completed' | 'current' | 'pending';
}

export default function ClientCaseTracker() {
  const phases: Phase[] = [
    { name: 'Filing', status: 'completed' },
    { name: 'Discovery', status: 'current' },
    { name: 'Mediation', status: 'pending' },
    { name: 'Trial', status: 'pending' },
    { name: 'Resolution', status: 'pending' },
  ];

  return (
    <div className="bg-gradient-to-br from-[#1A2B3C] to-[#243849] rounded-3xl p-8 mb-8 text-white">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display' }}>
          Your Case Progress
        </h2>
        <p className="text-white/80 text-sm mt-1">Property Dispute - Boundary Line Conflict</p>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        {/* Phases */}
        <div className="flex items-end justify-between mb-8 relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/20">
            <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{ width: '40%' }}></div>
          </div>

          {/* Phase Circles */}
          {phases.map((phase, index) => (
            <div key={index} className="flex flex-col items-center z-10">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300 ${
                  phase.status === 'completed'
                    ? 'bg-green-500'
                    : phase.status === 'current'
                      ? 'bg-[#D4AF37] animate-pulse'
                      : 'bg-white/20 border border-white'
                }`}
              >
                {phase.status === 'completed' ? (
                  <CheckCircle size={20} className="text-white" />
                ) : (
                  <Circle size={20} className={phase.status === 'current' ? 'text-[#1A2B3C]' : 'text-white'} />
                )}
              </div>
              <span className="text-xs font-medium text-center">{phase.name}</span>
              {phase.status === 'current' && (
                <span className="text-[#D4AF37] text-xs font-semibold mt-1">Current Phase</span>
              )}
            </div>
          ))}
        </div>

        {/* Status Text */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <p className="text-sm text-white mb-2">
            Documents are being collected and reviewed. Your attorney will contact you if additional information is
            needed.
          </p>
          <p className="text-xs text-white/60">Updated 2 days ago</p>
        </div>
      </div>
    </div>
  );
}
