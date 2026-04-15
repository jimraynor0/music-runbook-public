import { useState, useRef } from 'react';
import { Attachment } from '../../common/types/events';
import {
  uploadNoticeAttachment,
  deleteNoticeAttachment,
  validateFile,
  UploadProgress
} from '../../common/services/fileService';
import FileUploadView from './components/FileUploadView';

interface FileUploadProps {
  eventId: string;
  noticeId: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  onPersistChanges?: () => Promise<void>;
}

function FileUpload({
  eventId,
  noticeId,
  attachments,
  onAttachmentsChange,
  onPersistChanges
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateFile(file);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 0 });

    try {
      const attachment = await uploadNoticeAttachment(
        eventId,
        noticeId,
        file,
        (progress) => setUploadProgress(progress)
      );

      const updatedAttachments = [...attachments, attachment];
      onAttachmentsChange(updatedAttachments);

      if (onPersistChanges) {
        await onPersistChanges();
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!window.confirm(`Delete ${attachment.fileName}?`)) return;

    try {
      await deleteNoticeAttachment(eventId, noticeId, attachment);
      const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
      onAttachmentsChange(updatedAttachments);

      if (onPersistChanges) {
        await onPersistChanges();
      }
    } catch (err: unknown) {
      console.error('Delete failed:', err);
      const error = err as { code?: string; message?: string };

      if (error.code === 'storage/unauthorized') {
        setError('Delete failed: Permission denied. Please check Firebase Storage rules.');
      } else {
        setError(`Delete failed: ${error.message || 'Unknown error'}.`);
      }
    }
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.downloadUrl, '_blank');
  };

  return (
    <FileUploadView
      uploading={uploading}
      uploadProgress={uploadProgress}
      error={error}
      attachments={attachments}
      fileInputRef={fileInputRef}
      onChooseFile={() => fileInputRef.current?.click()}
      onFileInputChange={handleFileInputChange}
      onDownload={handleDownload}
      onDelete={handleDelete}
    />
  );
}

export default FileUpload;
