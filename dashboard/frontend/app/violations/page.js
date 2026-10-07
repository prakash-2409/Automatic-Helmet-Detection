"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ViolationsPage() {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/violations')
      .then(res => res.json())
      .then(data => {
        setViolations(data.violations);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>All Violations</h2>
      <div className="card table-container" style={{ marginTop: '2rem' }}>
        <table>
          <thead>
            <tr>
              <th>Plate Number</th>
              <th>Violation Type</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Fine Amount</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {violations.map(v => (
              <tr key={v._id}>
                <td style={{ fontWeight: 'bold' }}>{v.plateText}</td>
                <td>{v.violationType.replace('_', ' ').toUpperCase()}</td>
                <td>{new Date(v.detectedAt).toLocaleString()}</td>
                <td>
                  <span className={`badge ${
                    v.status === 'confirmed' || v.status === 'auto_fined' ? 'success' :
                    v.status === 'dismissed' ? 'danger' : 'warning'
                  }`}>
                    {v.status.replace('_', ' ')}
                  </span>
                </td>
                <td>₹{v.fineAmount}</td>
                <td>
                  <Link href={`/violations/${v._id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    Inspect
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
