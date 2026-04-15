import { useState, useEffect } from 'react';
import { Event, Notice } from '../../common/types/events';
import { createEvent, updateEvent, updateEventNotices } from '../../common/services/eventService';
import FileUpload from './FileUpload';
import EventFormView from './components/EventFormView';

interface EventFormProps {
  event?: Event | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    notices: [] as Notice[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNoticeText, setNewNoticeText] = useState('');
  const [persistingAttachments, setPersistingAttachments] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        date: new Date(event.date).toISOString().split('T')[0],
        notices: event.notices || []
      });
    } else {
      setFormData({
        name: '',
        date: '',
        notices: []
      });
    }
  }, [event]);

  const handleAddNotice = () => {
    if (newNoticeText.trim()) {
      const newNotice: Notice = {
        id: Date.now().toString(),
        text: newNoticeText.trim(),
        attachments: []
      };
      setFormData(prev => ({
        ...prev,
        notices: [...prev.notices, newNotice]
      }));
      setNewNoticeText('');
    }
  };

  const handleRemoveNotice = (noticeId: string) => {
    setFormData(prev => ({
      ...prev,
      notices: prev.notices.filter(notice => notice.id !== noticeId)
    }));
  };

  const handleNoticeTextChange = (noticeId: string, content: string) => {
    setFormData(prev => ({
      ...prev,
      notices: prev.notices.map(n =>
        n.id === noticeId ? { ...n, text: content } : n
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (event) {
        await updateEvent(event.id, formData);
      } else {
        await createEvent(formData);
      }
      onSuccess();
    } catch (err) {
      setError(`Failed to ${event ? 'update' : 'create'} event`);
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePersistNoticesChanges = async () => {
    if (!event?.id) return;

    setPersistingAttachments(true);
    try {
      await updateEventNotices(event.id, formData.notices);
      console.log('Notices persisted to Firestore');
    } catch (err) {
      console.error('Failed to persist notices:', err);
      setError('Failed to save attachment changes');
    } finally {
      setPersistingAttachments(false);
    }
  };

  const renderNoticeAttachments = (notice: Notice) => (
    <FileUpload
      eventId={event?.id || 'temp'}
      noticeId={notice.id}
      attachments={notice.attachments || []}
      onAttachmentsChange={(attachments) => {
        setFormData(prev => ({
          ...prev,
          notices: prev.notices.map(n =>
            n.id === notice.id ? { ...n, attachments } : n
          )
        }));
      }}
      onPersistChanges={event?.id ? handlePersistNoticesChanges : undefined}
    />
  );

  return (
    <EventFormView
      name={formData.name}
      date={formData.date}
      notices={formData.notices}
      newNoticeText={newNoticeText}
      loading={loading}
      error={error}
      persistingAttachments={persistingAttachments}
      isEditing={!!event}
      onNameChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
      onDateChange={(value) => setFormData(prev => ({ ...prev, date: value }))}
      onNewNoticeTextChange={setNewNoticeText}
      onAddNotice={handleAddNotice}
      onRemoveNotice={handleRemoveNotice}
      onNoticeTextChange={handleNoticeTextChange}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      renderNoticeAttachments={renderNoticeAttachments}
    />
  );
}

export default EventForm;
