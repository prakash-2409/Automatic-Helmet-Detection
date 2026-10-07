import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Police Dashboard - Helmet & Plate Detection',
  description: 'SaaS dashboard for Helmet Violation Detection & E-Challan system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="layout-container">
          <aside className="sidebar">
            <h1>TN Police E-Challan</h1>
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/">🏠 Dashboard</Link>
              <Link href="/violations">📋 All Violations</Link>
              <Link href="/review">⚠️ Review Queue</Link>
              <Link href="/statistics">📊 Statistics</Link>
              <Link href="/upload">📤 Upload Video</Link>
            </nav>
          </aside>
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
