import { LiveDataUnavailable } from '@/app/super/components/live-data-unavailable';

export default function CustomerServicePage() {
  return (
    <LiveDataUnavailable
      title="Customer service data is not connected"
      description="Agora does not currently have a live support-ticket integration for this workspace. Ticket counts, response times, satisfaction scores, and agent assignments are not available here."
    />
  );
}
