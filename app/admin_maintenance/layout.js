import AuthGuard from '../AuthGuard';

export default function AdminMaintenanceLayout({
  children,
}) {
  return (
    <AuthGuard
      allowedRoles={[
        'admin',
      ]}
    >
      {children}
    </AuthGuard>
  );
}