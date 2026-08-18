import "./globals.css";

export const metadata = {
  title: "Campus Facility QA",
  description:
    "Campus Facility Fault Reporting and Maintenance Tracking System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}