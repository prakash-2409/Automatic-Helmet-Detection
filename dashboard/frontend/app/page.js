"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const statsRes = await fetch('/api/violations/stats');
        const statsData = await statsRes.json();
        setStats(statsData);

        const violationsRes = await fetch('/api/violations?limit=5');
        const violationsData = await violationsRes.json();
        setRecent(violationsData.violations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Error loading data</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 0 }}>Total Violations</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 0 }}>Pending Review</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pending}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 0 }}>Auto-Fined</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', fontWeight: 'bold', color: 'var(--success)' }}>{stats.autoFined}</p>
        </div>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 0 }}>Dismissed</h3>
          <p style={{ fontSize: '2rem', margin: '0.5rem 0', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.dismissed}</p>
        </div>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Recent Activity</h2>
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Plate</th>
              <th>Type</th>
              <th>Confidence</th>
              <th>Status</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(v => (
              <tr key={v._id}>
                <td style={{ fontWeight: 'bold' }}>{v.plateText}</td>
                <td>{v.violationType.replace('_', ' ').toUpperCase()}</td>
                <td>
                  <span className={`badge ${v.confidence > 0.9 ? 'success' : v.confidence > 0.8 ? 'warning' : 'danger'}`}>
                    {(v.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    v.status === 'confirmed' || v.status === 'auto_fined' ? 'success' :
                    v.status === 'dismissed' ? 'danger' : 'warning'
                  }`}>
                    {v.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{new Date(v.detectedAt).toLocaleString()}</td>
                <td>
                  <Link href={`/violations/${v._id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    View
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
