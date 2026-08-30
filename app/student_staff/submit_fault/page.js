'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cffrPrototypeReports';
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function reportLocation(report) {
  if (report.location) return report.location;
  return [report.building, report.roomNumber].filter(Boolean).join(' · ') || 'Location unavailable';
}

export default function SubmitFaultPage() {
  const fileInputRef = useRef(null);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [reports, setReports] = useState([]);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);
      const savedReports = savedValue ? JSON.parse(savedValue) : [];
      setReports(Array.isArray(savedReports) ? savedReports : []);
    } catch (storageError) {
      console.error('Could not load prototype reports:', storageError);
      setError('Saved reports could not be loaded. Check that browser storage is enabled.');
    } finally {
      setLoaded(true);
    }
  }, []);

  function handleImageChange(event) {
    const selectedImage = event.target.files?.[0] || null;
    setError('');

    if (selectedImage && !ALLOWED_IMAGE_TYPES.has(selectedImage.type)) {
      event.target.value = '';
      setImage(null);
      setError('The optional image must be a JPG, JPEG, or PNG file.');
      return;
    }

    if (selectedImage && selectedImage.size > MAX_IMAGE_SIZE) {
      event.target.value = '';
      setImage(null);
      setError('The optional image must be 5 MB or smaller.');
      return;
    }

    setImage(selectedImage);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmittedReport(null);

    const cleanLocation = location.trim();
    const cleanDescription = description.trim();

    if (!cleanLocation || !cleanDescription) {
      setError('Location and description are required.');
      return;
    }

    if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
      return;
    }

    const report = {
      id: `FR-${Date.now().toString(36).toUpperCase()}`,
      userId: 'prototype-user',
      location: cleanLocation,
      description: cleanDescription,
      imageName: image?.name || '',
      imageSize: image?.size || 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);
      const savedReports = savedValue ? JSON.parse(savedValue) : [];
      const currentReports = Array.isArray(savedReports) ? savedReports : [];
      const updatedReports = [report, ...currentReports];

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
      setReports(updatedReports);
      setSubmittedReport(report);
      setLocation('');
      setDescription('');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (storageError) {
      console.error('Could not save prototype report:', storageError);
      setError('The report could not be saved. Check that browser storage is enabled.');
    }
  }

  return (
    <main className="report-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student / Staff portal</p>
          <h1>Report a Facility Fault</h1>
          <p>Submit a fault and review your saved prototype reports on this page.</p>
        </div>
        <Link href="/student_staff/dashboard" className="back-button">Back to dashboard</Link>
      </header>

      {submittedReport && (
        <section className="success-card" role="status">
          <span className="success-icon" aria-hidden="true">&#10003;</span>
          <div>
            <h2>Report submitted successfully</h2>
            <p><strong>{submittedReport.id}</strong> was saved in this browser.</p>
            <dl>
              <div><dt>Location</dt><dd>{submittedReport.location}</dd></div>
              <div><dt>Status</dt><dd>Open</dd></div>
              <div><dt>Submitted</dt><dd>{formatDate(submittedReport.createdAt)}</dd></div>
            </dl>
          </div>
        </section>
      )}

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit} noValidate>
          <div className="panel-heading">
            <div>
              <p className="section-label">New report</p>
              <h2>Fault information</h2>
            </div>
            <span>Fields marked * are required</span>
          </div>

          <label>
            <span>Location *</span>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={120}
              placeholder="Example: Library, Level 2, Room L2-14"
              required
            />
          </label>

          <label>
            <span>Description *</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={8}
              placeholder="Describe the fault, what is affected, and any safety concern."
              required
            />
            <small className="character-count">{description.length}/{MAX_DESCRIPTION_LENGTH} characters</small>
          </label>

          <label className="image-field">
            <span>Image (optional)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleImageChange}
            />
            <small>JPG, JPEG, or PNG, up to 5 MB. This prototype records the filename only.</small>
            {image && <strong>Selected: {image.name}</strong>}
          </label>

          <div className="form-actions">
            <button type="submit">Submit report</button>
          </div>
        </form>

        <section className="panel reports-panel" aria-labelledby="saved-reports-heading">
          <div className="panel-heading">
            <div>
              <p className="section-label">Prototype history</p>
              <h2 id="saved-reports-heading">My saved reports</h2>
            </div>
            <strong className="report-count">{reports.length}</strong>
          </div>

          {!loaded && <p className="empty-state">Loading reports...</p>}

          {loaded && reports.length === 0 && (
            <div className="empty-state">
              <strong>No reports submitted yet</strong>
              <p>Your submitted reports will appear here and remain after refreshing the page.</p>
            </div>
          )}

          <div className="report-list">
            {reports.map((report) => (
              <article className="report-item" key={report.id}>
                <div className="report-topline">
                  <strong>{report.id}</strong>
                  <span>{report.status || 'open'}</span>
                </div>
                <h3>{reportLocation(report)}</h3>
                <p>{report.description}</p>
                <div className="report-footer">
                  <time>{formatDate(report.createdAt)}</time>
                  <small>{report.imageName ? `Image: ${report.imageName}` : 'No image'}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <p className="prototype-note">
        Prototype only: reports are stored in this browser, not in the shared SQLite database.
      </p>

      <style jsx>{`
        .report-page{width:min(100%,1180px);min-height:100vh;margin:auto;padding:38px clamp(20px,3.5vw,48px) 52px;background:#f5f7fb;color:#172033}.page-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:22px}.eyebrow,.section-label{margin:0 0 7px;color:#2563eb;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}h1{margin:0;color:#0f172a;font-size:clamp(30px,4vw,42px);line-height:1.1}.page-header p:last-child{max-width:650px;margin:10px 0 0;color:#68758a;line-height:1.55}.back-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 14px;border:1px solid #ccd6e3;border-radius:8px;background:#fff;color:#344159;font-size:13px;font-weight:800;text-decoration:none}
        .success-card{display:flex;gap:14px;margin-bottom:17px;padding:17px 19px;border:1px solid #a7f3d0;border-radius:13px;background:#ecfdf5;color:#065f46}.success-icon{display:grid;place-items:center;width:30px;height:30px;flex:0 0 30px;border-radius:50%;background:#10b981;color:#fff;font-weight:900}.success-card h2{margin:0;font-size:16px}.success-card p{margin:4px 0 12px;font-size:13px}.success-card dl{display:flex;flex-wrap:wrap;gap:9px 25px;margin:0}.success-card dl div{display:flex;gap:6px}.success-card dt{font-size:11px;font-weight:700}.success-card dd{margin:0;font-size:11px}.error-message{margin-bottom:17px;padding:13px 15px;border:1px solid #fecaca;border-radius:9px;background:#fef2f2;color:#b91c1c;font-size:13px;font-weight:700}
        .content-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(330px,.92fr);gap:19px;align-items:start}.panel{border:1px solid #dfe6ef;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(29,48,76,.04)}.form-panel{display:grid;gap:18px;padding:22px}.panel-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e8edf3}.panel-heading h2{margin:0;color:#172033;font-size:18px}.panel-heading>span{color:#8994a6;font-size:10px}.form-panel label{display:flex;flex-direction:column;gap:7px;color:#45536a;font-size:13px;font-weight:700}.form-panel input,.form-panel textarea{width:100%;padding:10px 11px;border:1px solid #cdd7e4;border-radius:8px;background:#fff;color:#26344b;font:inherit;font-size:14px}.form-panel textarea{min-height:165px;resize:vertical;line-height:1.5}.form-panel input:focus,.form-panel textarea:focus{border-color:#2563eb;outline:3px solid rgba(37,99,235,.14)}.character-count{align-self:flex-end;color:#8994a6}.image-field{padding:15px;border:1px dashed #aebdd0;border-radius:10px;background:#fafcff}.image-field input{padding:8px}.image-field small{color:#7b8798;font-weight:500}.image-field strong{color:#1d4ed8;font-size:12px}.form-actions{display:flex;justify-content:flex-end}.form-actions button{min-height:41px;padding:9px 17px;border:1px solid #1d4ed8;border-radius:8px;background:#2563eb;color:#fff;font-size:13px;font-weight:800;cursor:pointer}.form-actions button:hover{background:#1d4ed8}
        .reports-panel{overflow:hidden}.reports-panel>.panel-heading{margin:0 21px;padding:20px 0 16px}.report-count{display:grid;place-items:center;min-width:32px;height:32px;padding:0 9px;border-radius:999px;background:#e8f0ff;color:#1d4ed8;font-size:12px}.report-list{display:grid}.report-item{padding:17px 21px;border-bottom:1px solid #edf1f5}.report-item:last-child{border-bottom:0}.report-topline{display:flex;justify-content:space-between;gap:12px}.report-topline>strong{color:#1d4ed8;font-size:11px}.report-topline>span{padding:4px 8px;border-radius:999px;background:#e8f0ff;color:#1d4ed8;font-size:9px;font-weight:900;text-transform:uppercase}.report-item h3{margin:9px 0 6px;color:#25334a;font-size:14px}.report-item>p{display:-webkit-box;overflow:hidden;margin:0;color:#68758a;font-size:12px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:3}.report-footer{display:flex;justify-content:space-between;gap:12px;margin-top:12px;color:#8a95a5;font-size:10px}.report-footer small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.empty-state{padding:34px 21px;color:#748095;text-align:center;font-size:12px}.empty-state strong{display:block;margin-bottom:7px;color:#26344b;font-size:14px}.empty-state p{margin:0;line-height:1.55}.prototype-note{margin:18px 0 0;color:#7b8798;font-size:11px;text-align:center}
        @media(max-width:850px){.content-grid{grid-template-columns:1fr}}@media(max-width:620px){.report-page{padding:27px 17px 40px}.page-header{flex-direction:column}.back-button{width:100%}.success-card dl{display:grid;gap:6px}.panel-heading{flex-direction:column}.report-footer{flex-direction:column}.form-actions button{width:100%}}
      `}</style>
    </main>
  );
}
