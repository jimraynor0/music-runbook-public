import { useEvents } from '../../common/hooks/useEvents';
import PublicEventsPageView from './components/PublicEventsPageView';

function PublicEventsPage() {
  const { events, loading, error } = useEvents();

  return (
    <PublicEventsPageView
      events={events}
      loading={loading}
      error={error}
    />
  );
}

export default PublicEventsPage;
