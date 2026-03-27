import React from 'react';

interface ConsoleProps {
  deaths: number;
  lessons: number;
  quotaExhausted: boolean;
}

export const CommandConsole: React.FC<ConsoleProps> = ({ deaths, lessons, quotaExhausted }) => {
  return (
    <div className="dalek-console bg-black text-red-500 p-6 border-4 border-red-900 font-mono">
      <h2 className="text-2xl font-bold mb-4 animate-pulse">DALEK_GROG STRATEGIC OVERVIEW</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-box border border-red-700 p-2">
          <span className="block text-xs uppercase">Units Lost</span>
          <span className="text-3xl">{deaths}</span>
        </div>
        <div className="stat-box border border-red-700 p-2">
          <span className="block text-xs uppercase">Lessons Siphoned</span>
          <span className="text-3xl">{lessons}</span>
        </div>
      </div>
      {quotaExhausted && (
        <div className="mt-4 text-white bg-red-600 p-2 text-center animate-bounce">
          CRITICAL: QUOTA EXHAUSTED - CEASE OPERATIONS
        </div>
      )
    </div>
  );
};