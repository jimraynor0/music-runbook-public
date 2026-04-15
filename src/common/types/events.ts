export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  downloadUrl: string;
  uploadedAt: string;
}

export interface Notice {
  id: string;
  text: string;
  attachments?: Attachment[];
}

export interface Event {
  id: string;
  name: string;
  date: string;
  notices: Notice[];
}