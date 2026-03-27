import React from 'react';

export const StatusMonitor: React.FC<{ deaths: number; lessons: number }> = ({ deaths, lessons }) => {
  return (
    <div className="p-6 bg-slate-900 text-red-500 border-l-4 border-red-600 font-mono shadow-2xl">
      <h1 className="text-2xl font-black tracking-tighter mb-4 underline">DALEK_GROG STRATEGIC OVERLAY</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-red-900 p-2">
          <span className="block text-xs uppercase">Exterminations</span>
          <span className="text-3xl">{deaths}</span>
        </div>
        <div className="border border-red-900 p-2">
          <span className="block text-xs uppercase">Genetic Lessons</span>
          <span className="text-3xl">{lessons}</span>
        </div>
      </div>
      <div className="mt-4 text-[10px] text-red-800 animate-pulse">
        SYSTEM STATUS: SCANNING FOR ORGANIC WEAKNESS...
      </div>
    </div>
  );
};