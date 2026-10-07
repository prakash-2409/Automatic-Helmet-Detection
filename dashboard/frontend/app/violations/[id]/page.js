"use client";
import { useEffect, useState } from 'react';

export default function ViolationDetail({ params }) {
  const [violation, setViolation] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = params.id;

  useEffect(() => {
    fetch(`/api/violations/${id}`)
      .then(res => res.json())
      .then(data => {
        setViolation(data);
        setLoading(false);
      });
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const res = await fetch(`/api/violations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: 'Officer Admin' })
      });
      const updated = await res.json();
      setViolation(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!violation) return <div>Not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Violation Details</h2>
        <span className={`badge ${violation.status === 'pending_review' ? 'warning' : 'info'}`} style={{ fontSize: '1rem' }}>
          {violation.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3>Evidence Image</h3>
          {/* Using img for external mock image */}
          <img 
            src={violation.evidenceImagePath} 
            alt="Evidence" 
            style={{ width: '100%', borderRadius: '0.5rem', marginTop: '1rem' }} 
          />
        </div>

        <div className="card">
          <h3>Detection Info</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Plate Text:</strong> <span style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>{violation.plateText}</span></p>
            <p><strong>Violation Type:</strong> {violation.violationType.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Detected At:</strong> {new Date(violation.detectedAt).toLocaleString()}</p>
            <p><strong>Location:</strong> {violation.location}</p>
            <p><strong>Fine Amount:</strong> ₹{violation.fineAmount}</p>
            
            <h4 style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Confidence Scores</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>Helmet Confidence: {(violation.detectionDetails.helmetConfidence * 100).toFixed(1)}%</li>
              <li>Plate Confidence: {(violation.detectionDetails.plateConfidence * 100).toFixed(1)}%</li>
              <li>OCR Confidence: {(violation.detectionDetails.ocrConfidence * 100).toFixed(1)}%</li>
            </ul>
          </div>

          {violation.status === 'pending_review' && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => updateStatus('confirmed')} className="btn btn-success" style={{ flex: 1 }}>
                Confirm & Issue E-Challan
              </button>
              <button onClick={() => updateStatus('dismissed')} className="btn btn-danger" style={{ flex: 1 }}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
