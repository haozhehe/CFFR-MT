'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { validateReport, validateImage, MAX_DESCRIPTION_LENGTH } from './lib/validation';

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
  const [submittedReport, setSubmittedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = window.localStorage.getItem('currentUser');
    if (!savedUser) {
      setError('You need to be logged in to submit a fault.');
      setIsLoading(false);
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setCurrentUser(parsedUser);
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    async function loadReports() {
      try {
        const response = await fetch(`/api/reports?userId=${currentUser.id}&role=${currentUser.role}`);
        const data = await response.json();

        if (!response.ok || data.error) {
          setReports([]);
          setError(data.error || 'Unable to load your reports.');
          return;
        }

        setReports(Array.isArray(data.reports) ? data.reports : []);
        setError('');
      } catch (loadError) {
        setReports([]);
        setError('Unable to load reports from the database.');
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, [currentUser]);

  function resetForm() {
    setLocation('');
    setDescription('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleImageChange(event) {
    const selectedImage = event.target.files?.[0] || null;
    setError('');

    if (selectedImage) {
      const imageError = validateImage(selectedImage);
      if (imageError) {
        event.target.value = '';
        setImage(null);
        setError(imageError);
        return;
      }
    }

    setImage(selectedImage);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmittedReport(null);
    setIsSubmitting(true);

    const validationError = validateReport(location, description);
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    if (!currentUser) {
      setError('You need to be logged in to submit a fault.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('userId', String(currentUser.id));
      formData.append('location', location.trim());
      formData.append('description', description.trim());

      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Unable to save the report.');
        setIsSubmitting(false);
        return;
      }

      const savedReport = {
        id: data.report?.id,
        location: location.trim(),
        description: description.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        imagePath: image?.name || null,
      };

      setSubmittedReport(savedReport);
      setReports((prev) => [savedReport, ...prev]);
      resetForm();
    } catch (submitError) {
      setError('Unable to save the report to the database.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="report-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Student / Staff portal</p>
          <h1>Report a Facility Fault</h1>
          <p>Submit a fault and view your saved reports from the database.</p>
        </div>
        <Link href="/student_staff/dashboard" className="back-button">Back to dashboard</Link>
      </header>

      {submittedReport && (
        <section className="success-card" role="status">
          <span className="success-icon" aria-hidden="true">&#10003;</span>
          <div>
            <h2>Report submitted successfully</h2>
            <p><strong>FR-{submittedReport.id}</strong> was saved to the database.</p>
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              aria-label="Upload fault report image"
            />
            <small>JPG, JPEG, or PNG, up to 5 MB. This prototype records the filename only.</small>
            {image && <strong>Selected: {image.name}</strong>}
          </label>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>

        <section className="panel reports-panel" aria-labelledby="saved-reports-heading">
          <div className="panel-heading">
            <div>
              <p className="section-label">Database history</p>
              <h2 id="saved-reports-heading">My saved reports</h2>
            </div>
            <strong className="report-count">{reports.length}</strong>
          </div>

          {isLoading && <p className="empty-state">Loading reports...</p>}

          {!isLoading && reports.length === 0 && (
            <div className="empty-state">
              <strong>No reports submitted yet</strong>
              <p>Your submitted reports will appear here once they are saved to the database.</p>
            </div>
          )}

          <div className="report-list">
            {reports.map((report) => (
              <article className="report-item" key={report.id}>
                <div className="report-topline">
                  <strong>FR-{report.id}</strong>
                  <span>{report.status || 'open'}</span>
                </div>
                <h3>{reportLocation(report)}</h3>
                <p>{report.description}</p>
                <div className="report-footer">
                  <time>{formatDate(report.createdAt)}</time>
                  <small>{report.imagePath ? `Image: ${report.imagePath}` : 'No image'}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .report-page{width:min(100%,1180px);min-height:100vh;margin:auto;padding:38px clamp(20px,3.5vw,48px) 52px;background:#f5f7fb;color:#172033}.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.page-header>div{flex:1}.eyebrow{margin:0;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#7c8fa1}h1{margin:8px 0 12px;font-size:32px;font-weight:700;line-height:1.2}.page-header>p{margin:0;font-size:16px;color:#525f79}.back-button{padding:8px 16px;border:1px solid #dfe6ef;border-radius:8px;background:#fff;color:#172033;text-decoration:none;font-weight:500;transition:all 0.2s ease}.back-button:hover{border-color:#172033;background:#f5f7fb}
        .success-card{display:flex;gap:14px;margin-bottom:17px;padding:17px 19px;border:1px solid #a7f3d0;border-radius:13px;background:#ecfdf5;color:#065f46}.success-icon{display:grid;place-items:center;min-width:32px;height:32px;border-radius:50%;background:#a7f3d0;font-size:18px;font-weight:700}.success-card h2{margin:0 0 8px;font-size:18px}.success-card p{margin:0 0 12px;font-size:14px}.success-card dl{margin:0;font-size:13px;display:grid;gap:6px}.success-card div{display:grid;grid-template-columns:auto 1fr;gap:12px}.success-card dt{font-weight:600}.success-card dd{margin:0;text-align:left}
        .error-message{padding:12px 16px;margin-bottom:16px;border:1px solid #fecaca;border-radius:8px;background:#fef2f2;color:#991b1b;font-size:14px}
        .content-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(330px,.92fr);gap:19px;align-items:start}.panel{border:1px solid #dfe6ef;border-radius:14px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1)}.form-panel{padding:24px}.panel-heading{margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb}.panel-heading{display:flex;justify-content:space-between;align-items:flex-start}.panel-heading>div{flex:1}.section-label{margin:0;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#7c8fa1}.panel-heading h2{margin:8px 0 0;font-size:20px;font-weight:700}.panel-heading>span{font-size:12px;color:#7c8fa1;white-space:nowrap}label{display:grid;margin-bottom:20px;gap:8px}label>span{font-weight:500;color:#172033;font-size:14px}input[type="text"],textarea{padding:10px 12px;border:1px solid #dfe6ef;border-radius:8px;font-family:inherit;font-size:14px;color:#172033}input[type="text"]:focus,textarea:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.1)}input[type="text"]:disabled,textarea:disabled{background:#f5f7fb;cursor:not-allowed}textarea{resize:vertical}.character-count{font-size:12px;color:#7c8fa1;text-align:right}
        .image-field small{font-size:12px;color:#7c8fa1;display:block}input[type="file"]{padding:8px;border:1px solid #dfe6ef;border-radius:8px;cursor:pointer}input[type="file"]:disabled{cursor:not-allowed;background:#f5f7fb}.image-field strong{display:block;margin-top:8px;font-size:14px;color:#059669}
        .form-actions{display:grid;gap:12px;margin-top:28px}button[type="submit"]{padding:12px 24px;border:none;border-radius:8px;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer;transition:background 0.2s ease}button[type="submit"]:hover:not(:disabled){background:#2563eb}button[type="submit"]:disabled{background:#9ca3af;cursor:not-allowed;opacity:0.7}
        .reports-panel{overflow:hidden}.reports-panel>.panel-heading{margin:0 21px;padding:20px 0 16px}.report-count{display:grid;place-items:center;min-width:32px;height:32px;padding:0 9px;border-radius:20px;background:#e5e7eb;font-size:13px;font-weight:600;color:#172033}
        .empty-state{padding:32px 24px;text-align:center;color:#7c8fa1}.empty-state strong{display:block;margin-bottom:8px;color:#172033;font-size:16px}
        .report-list{display:grid;gap:0}.report-item{padding:20px 24px;border-bottom:1px solid #e5e7eb;display:grid;gap:12px}.report-item:last-child{border-bottom:none}.report-topline{display:flex;justify-content:space-between;align-items:center}.report-topline strong{color:#172033;font-size:14px}.report-topline span{padding:4px 10px;border-radius:4px;background:#e5e7eb;color:#172033;font-size:12px;font-weight:500}.report-item h3{margin:0;font-size:16px;font-weight:600;color:#172033}.report-item p{margin:0;font-size:14px;color:#525f79;line-height:1.5}.report-footer{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#7c8fa1}.prototype-note{margin-top:24px;padding:12px;border-left:4px solid #10b981;background:#ecfdf5;color:#065f46;font-size:13px}
        @media(max-width:850px){.content-grid{grid-template-columns:1fr}}@media(max-width:620px){.report-page{padding:27px 17px 40px}.page-header{flex-direction:column;gap:16px}.back-button{width:100%}.success-card{flex-direction:column}.panel-heading{flex-direction:column;gap:12px}}
      `}</style>
    </main>
  );
}
