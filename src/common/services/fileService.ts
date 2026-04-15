import {
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { storage } from '../firebase/config';
import { Attachment } from '../types/events';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export const uploadNoticeAttachment = async (
  eventId: string,
  noticeId: string,
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<Attachment> => {
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

  const storageRef = ref(
    storage,
    `events/${eventId}/notices/${noticeId}/attachments/${uniqueFileName}`
  );

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress: UploadProgress = {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        };
        onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const attachment: Attachment = {
            id: timestamp.toString(),
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
            downloadUrl,
            uploadedAt: new Date().toISOString()
          };
          resolve(attachment);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

export const deleteNoticeAttachment = async (
  eventId: string,
  noticeId: string,
  attachment: Attachment
): Promise<void> => {
  try {
    // Extract filename from download URL or use timestamp + filename
    const timestamp = attachment.id;
    const sanitizedFileName = attachment.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`;

    const storageRef = ref(
      storage,
      `events/${eventId}/notices/${noticeId}/attachments/${uniqueFileName}`
    );

    await deleteObject(storageRef);
    console.log('Attachment deleted:', attachment.fileName);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (contentType: string): string => {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📽️';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType.startsWith('video/')) return '🎬';
  if (contentType.includes('zip') || contentType.includes('archive')) return '📦';
  return '📎';
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text files
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed'
];

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  return { valid: true };
};