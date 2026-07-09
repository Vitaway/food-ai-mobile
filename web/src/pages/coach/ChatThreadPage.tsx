import { Navigate, useParams } from 'react-router-dom';

/** Legacy route — redirects into the unified messages layout. */
export function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/coach/messages" replace />;
  return <Navigate to={`/coach/messages/${id}`} replace />;
}
