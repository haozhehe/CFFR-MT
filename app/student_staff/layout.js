import AuthGuard from '../AuthGuard';

export default function StudentStaffLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}