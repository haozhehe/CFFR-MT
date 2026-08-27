export default function Home() {
  return (
    <main className="landing-page">
      <section className="hero">
        <div className="project-label">
          SOFTWARE QUALITY ASSURANCE PROJECT
        </div>

        <h1>Campus Facility Fault Reporting System</h1>

        <p>
          A prototype system for reporting, tracking and managing facility
          maintenance issues across campus.
        </p>

        <div className="role-grid">
          <div className="role-card">
            <h2>Student / Staff</h2>
            <p>
              Submit facility faults and monitor the progress of submitted
              reports.
            </p>
          </div>

          <div className="role-card">
            <h2>Maintenance</h2>
            <p>
              Review reported faults, assign technicians and update repair
              progress.
            </p>
          </div>

          <div className="role-card">
            <h2>Administrator</h2>
            <p>
              Monitor maintenance activity, statistics and user access.
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}