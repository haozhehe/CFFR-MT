import AuthGuard from '../AuthGuard';

export default function TechnicianLayout({
  children,
}) {
  return (
    <AuthGuard
      allowedRoles={[
        'technician',
      ]}
    >
      {children}
    </AuthGuard>
  );
}