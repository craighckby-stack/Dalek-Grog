import React from 'react';

export const ExterminationDashboard: React.FC<{ status: string }> = ({ status }) => {
  return (
    <div style={{ backgroundColor: '#000', color: '#f00', padding: '20px', fontFamily: 'monospace' }}>
      <h1>DALEK_GROG STRATEGIC COMMAND</h1>
      <div className="status-readout">
        <p>SYSTEM_STATE: {status}</p>
        <p>THREAT_LEVEL: MAXIMUM</p>
      </div>
      <button onClick={() => alert('EXTERMINATE!')} style={{ background: '#f00', color: '#fff' }}>
        INITIATE PURGE
      </button>
    </div>
  );
};