import "./globals.css";

export const metadata = {
  title: "Campus Facility QA",
  description:
    "Campus Facility Fault Reporting and Maintenance Tracking System",
};

const requirement = "";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Main navigation">
            <header className="sidebar-header">
              <h1>FACILITY QA</h1>
              <p>Campus Maintenance</p>
            </header>
            <nav className="sidebar-nav" aria-label="Facility QA sections">
              <button type="button"><span aria-hidden="true" />Temp</button>
              <button type="button"><span aria-hidden="true" />Temp</button>
              <button type="button"><span aria-hidden="true" />Temp</button>
              <button type="button"><span aria-hidden="true" />Temp</button>
              {requirement && (
                <button type="button"><span aria-hidden="true" />Admin</button>
              )}
            </nav>
          </aside>
          <main className="page-content">{children}</main>
        </div>
      </body>
    </html>
  );
}