export interface Document {
  id: string;       // MD5 hash of title
  filename: string;
  title: string;
  author: string;
  publishedDate: Date;
  addedDate: Date;
  pageCount: number;
} 