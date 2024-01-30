import { Document } from "../entities/Document";
import { Progress } from "../entities/Progress";

export interface DataProviderOptions<T> {
  [key: string]: T;
}
export interface DataProvider<T> {
  authorize(authorizeOptions: T): void;
  authorizeNango?(nangoAuthorizeOptions: T): void;
  setOptions(options: T): void;
  getDocuments(
    inProgress?: (progress: Progress) => void
  ): Promise<Document[] | []>;
}
