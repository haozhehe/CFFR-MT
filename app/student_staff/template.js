import PortalNavigation from '../_navigation/PortalNavigation.js';

export default function StudentStaffTemplate({ children }) {
  return <PortalNavigation role="student">{children}</PortalNavigation>;
}
