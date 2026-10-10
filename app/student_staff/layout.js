import AuthGuard from '../AuthGuard';

export default function StudentStaffLayout({
  children,
}) {
  return (
    <AuthGuard
      allowedRoles={[
        'student',
        'staff',
      ]}
    >
      {children}
    </AuthGuard>
  );
}