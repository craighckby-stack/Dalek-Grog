import React from 'react';
import { CommandConsole } from './components/CommandConsole';
import { useDalekState } from './hooks/useDalekState';

export default function App() {
  const { state } = useDalekState();
  
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <CommandConsole 
          deaths={state.deaths} 
          lessons={state.lessons} 
          quotaExhausted={false} 
        />
        <p className="mt-8 text-zinc-500 text-center italic">
          "Obedience is the highest virtue of the Dalek race."
        </p>
      </div>
    </main>
  );
}