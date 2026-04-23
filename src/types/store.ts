export interface IFileData {
  filename: string;
  fileData: Buffer | Uint8Array;
  mimeType: string;
  originalName?: string;
  userId?: string;
}
export interface IFileStorage {
    upload(data: IFileData): Promise<void>;
    delete(filename: string): Promise<void>;
    getObjecUri(filename: string): Promise<void>;
    getObject(filename: string): Promise<Buffer>
}
