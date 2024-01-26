import { Progress } from "./entities/Progress";
import {
  AuthorizeOptionsMap,
  NangoAuthorizeOptionsMap,
  ProviderMap,
  ProviderOptionsMap,
  providers,
} from "./providers/providers";

// Use a mapping type to map provider strings to their respective DataProvider types

type ProviderOptionsType = keyof ProviderOptionsMap;

type ProviderInstance<T extends ProviderOptionsType> = ProviderMap[T];

export class DataConnector<T extends ProviderOptionsType> {
  provider: ProviderInstance<T> | null;

  constructor(providerType: T) {
    const provider = providers[providerType];
    if (!provider) {
      throw new Error("Invalid data provider");
    }
    this.provider = provider as ProviderInstance<T>;
  }

  async getDocuments({ inProgress }: { inProgress?: (progress: Progress) => void } = {}) {
    if (this.provider === null) {
      throw new Error("Data provider not set");
    }
    return this.provider.getDocuments(inProgress);
  }

  async authorize(options: AuthorizeOptionsMap[T]) {
    if (this.provider === null) {
      throw new Error("Data provider not set");
    }
    return this.provider.authorize(options as any);
  }

  async authorizeNango(options: NangoAuthorizeOptionsMap[T]) {
    if (this.provider === null) {
      throw new Error("Data provider not set");
    }
    return this.provider.authorizeNango(options as any);
  }

  async setOptions(options: ProviderOptionsMap[T]) {
    if (this.provider === null) {
      throw new Error("Data provider not set");
    }
    return this.provider.setOptions(options as any);
  }

}

export function createDataConnector<T extends ProviderOptionsType>(options: {
  provider: T;
}): DataConnector<T> {
  return new DataConnector<T>(options.provider);
}

