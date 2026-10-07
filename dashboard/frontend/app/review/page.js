"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ReviewQueue() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = () => {
    setLoading(true);
    fetch('/api/violations?status=pending_review')
      .then(res => res.json())
      .then(data => {
        setViolations(data.violations);
        setLoading(false);
      });
  };

  const quickAction = async (id, status) => {
    await fetch(`/api/violations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewedBy: 'Officer Admin' })
    });
    fetchQueue(); // refresh queue
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div>
      <h2>Review Queue</h2>
      <p style={{ color: 'var(--text-muted)' }}>Violations needing manual verification.</p>

      {violations.length === 0 ? (
        <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>No pending reviews. Good job!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {violations.map(v => (
            <div key={v._id} className="card">
              <img src={v.evidenceImagePath} alt="Evidence" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '0.25rem' }} />
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)' }}>{v.plateText}</h3>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{v.violationType.replace('_', ' ').toUpperCase()}</p>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(v.detectedAt).toLocaleString()}
                </p>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => quickAction(v._id, 'confirmed')} className="btn btn-success" style={{ flex: 1, padding: '0.5rem' }}>Confirm</button>
                  <button onClick={() => quickAction(v._id, 'dismissed')} className="btn btn-danger" style={{ flex: 1, padding: '0.5rem' }}>Dismiss</button>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <Link href={`/violations/${v._id}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>Full Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
