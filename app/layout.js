import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Campus Facility QA",
  description:
    "Campus Facility Fault Reporting and Maintenance Tracking System",
};

const adminAccess = false;

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
              <Link href="/">
                <span aria-hidden="true" />
                Temp
              </Link>

              <Link href="/">
                <span aria-hidden="true" />
                Temp
              </Link>

              <Link href="/">
                <span aria-hidden="true" />
                Temp
              </Link>

              <Link href="/">
                <span aria-hidden="true" />
                Temp
              </Link>
              {adminAccess && (
                <Link href="/">
                  <span aria-hidden="true" />
                  Admin
                </Link>
              )}
            </nav>
          </aside>
          <main className="page-content">{children}</main>
        </div>
      </body>
    </html>
  );
}