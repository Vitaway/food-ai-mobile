import { Navigate } from 'react-router-dom';
import { ADMIN_ROUTES } from '@/features/auth/constants';

/** Legacy route — coaches are managed on Users & roles. */
export function AdminCoachesPage() {
  return <Navigate to={`${ADMIN_ROUTES.users}?type=coach`} replace />;
}
