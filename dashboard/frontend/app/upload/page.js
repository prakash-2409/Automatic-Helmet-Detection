"use client";
import { useState } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.violation) {
        setResult(data.violation);
      } else {
        setError(data.message || 'Detection failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to detection pipeline failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2>Live Media Inference & E-Challan Generation</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Upload CCTV footage (video or traffic image) to trigger the 4-stage cascade YOLOv8 detector and OCR pipeline.
      </p>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleUpload}>
          <div style={{ 
            border: '2px dashed var(--border-color)', 
            padding: '2.5rem', 
            textAlign: 'center',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: 'rgba(255,255,255,0.02)'
          }}>
            <input 
              type="file" 
              accept="video/*,image/*" 
              onChange={e => setFile(e.target.files[0])}
              style={{ display: 'block', margin: '0 auto', cursor: 'pointer' }}
            />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Supports CCTV Video (MP4, AVI) or High-Res Traffic Images (JPG, PNG)
            </p>
            {file && (
              <p style={{ marginTop: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={!file || uploading}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', fontWeight: 600 }}
          >
            {uploading ? 'Running Cascade YOLO Detection & EasyOCR...' : 'Process Video / Image'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ef444422', border: '1px solid #ef4444', borderRadius: '0.5rem', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #10b981', borderRadius: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#10b981' }}>Detection Results</h3>
              <span className={`badge ${result.status === 'auto_fined' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.85rem' }}>
                {result.status === 'auto_fined' ? 'Auto-Fined (Confirmed)' : 'Pending Human Review'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detected Number Plate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {result.plateText}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Violation Type</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {result.violationType === 'no_helmet' ? 'Without Helmet' : 'Triple Riding'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>Fine: ₹{result.fineAmount}</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-color)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence Score</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: result.confidence >= 0.75 ? '#10b981' : '#f59e0b' }}>
                  {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Link href="/violations" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', textDecoration: 'none' }}>
                View in E-Challan Registry
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
