"use client";
import { useEffect, useState } from 'react';

export default function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/violations/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div>
      <h2>System Statistics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        <div className="card">
          <h3>Violations by Type</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>No Helmet</span>
                <span>{stats.byType.noHelmet}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: `${(stats.byType.noHelmet / stats.total) * 100}%`, height: '100%', backgroundColor: 'var(--danger)', borderRadius: '4px' }}></div>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Triple Riding</span>
                <span>{stats.byType.tripleRiding}</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px' }}>
                <div style={{ width: `${(stats.byType.tripleRiding / stats.total) * 100}%`, height: '100%', backgroundColor: 'var(--warning)', borderRadius: '4px' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Review Resolution</h3>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--success)', fontWeight: 'bold' }}>{stats.autoFined + 10 /* mock count */}</div>
              <div style={{ color: 'var(--text-muted)' }}>Confirmed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--danger)', fontWeight: 'bold' }}>{stats.dismissed}</div>
              <div style={{ color: 'var(--text-muted)' }}>Dismissed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', color: 'var(--warning)', fontWeight: 'bold' }}>{stats.pending}</div>
              <div style={{ color: 'var(--text-muted)' }}>Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
