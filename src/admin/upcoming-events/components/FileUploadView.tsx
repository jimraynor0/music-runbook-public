import { RefObject } from 'react';
import { Button, Alert, ProgressBar, ListGroup } from 'react-bootstrap';
import { Attachment } from '../../../common/types/events';
import { formatFileSize, getFileIcon, UploadProgress } from '../../../common/services/fileService';

interface FileUploadViewProps {
  uploading: boolean;
  uploadProgress: UploadProgress | null;
  error: string | null;
  attachments: Attachment[];
  fileInputRef: RefObject<HTMLInputElement>;
  onChooseFile: () => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
}

function FileUploadView({
  uploading,
  uploadProgress,
  error,
  attachments,
  fileInputRef,
  onChooseFile,
  onFileInputChange,
  onDownload,
  onDelete,
}: FileUploadViewProps) {
  return (
    <div>
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <div className="mb-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
          disabled={uploading}
          className="d-none"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.gif,.webp"
        />
        <Button
          variant="outline-primary"
          onClick={onChooseFile}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>

      {uploading && uploadProgress && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small>Uploading... {uploadProgress.percentage}%</small>
            <small>{formatFileSize(uploadProgress.bytesTransferred)} / {formatFileSize(uploadProgress.totalBytes)}</small>
          </div>
          <ProgressBar now={uploadProgress.percentage} />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mt-3">
          <h6>Attachments ({attachments.length})</h6>
          <ListGroup variant="flush">
            {attachments.map((attachment) => (
              <ListGroup.Item key={attachment.id} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <span className="me-2">{getFileIcon(attachment.contentType)}</span>
                  <div>
                    <div className="fw-medium">{attachment.fileName}</div>
                    <small className="text-muted">
                      {formatFileSize(attachment.fileSize)} •
                      {new Date(attachment.uploadedAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onDownload(attachment)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(attachment)}
                  >
                    Delete
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      <small className="text-muted d-block mt-2">
        Supported formats: PDF, Word, Excel, PowerPoint, images (JPG, PNG, GIF), text files, ZIP archives.
        Maximum file size: 10MB.
        <br />
        <strong>Note:</strong> If uploads fail with CORS errors, check FIREBASE_SETUP.md for Storage configuration.
      </small>
    </div>
  );
}

export default FileUploadView;
