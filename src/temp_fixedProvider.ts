import {
  EvaluationContext,
  FlagValue,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
  ProviderMetadata,
  ResolutionDetails,
  ResolutionReason,
  TypeMismatchError,
} from '@openfeature/react-sdk';
import { createFlagsmithInstance } from 'flagsmith';
import { IFlagsmith, IInitConfig, IState } from 'flagsmith/types';

export type FlagType = 'string' | 'number' | 'object' | 'boolean';

/**
 * Ret a value of the specified type based on the type parameter.
 *
 * @param value - The value to be converted or validated.
 * @param type - The target type for the conversion.
 * @returns The converted value if successful, or null if conversion fails or the type is unsupported.
 */
export const typeFactory = (
  value: string | number | boolean | null | undefined,
  type: FlagType
): FlagValue | undefined => {
  if (value === null) return undefined;
  switch (type) {
    case 'string':
      // eslint-disable-next-line valid-typeof
      return typeof value !== null && typeof value !== 'undefined'
        ? `${value}`
        : value;
    case 'number':
      return typeof value === 'number'
        ? value
        : parseFloat(value as string) || value;
    case 'boolean':
      return typeof value === 'boolean' ? value : false;
    case 'object':
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (error) {
          return value;
        }
      }
      return value;
    default:
      return value;
  }
};

export class FlagsmithClientProvider implements Provider {
  readonly metadata: ProviderMetadata = {
    name: FlagsmithClientProvider.name,
  };

  readonly runsOn = 'client';
  //The Flagsmith Client
  private _client: IFlagsmith;
  //The Open Feature logger to use
  private _logger?: Logger;
  //The configuration used for the Flagsmith SDK
  private _config: IInitConfig;
  // The Open Feature event emitter
  events = new OpenFeatureEventEmitter();

  constructor({
    logger,
    flagsmithInstance,
    ...config
  }: Omit<IInitConfig, 'identity' | 'traits'> & {
    logger?: Logger;
    flagsmithInstance?: IFlagsmith;
  }) {
    this._logger = logger;
    this._client = flagsmithInstance || createFlagsmithInstance();
    this._config = config;
  }

  async initialize(context?: EvaluationContext & Partial<IState>) {
    const identity = context?.targetingKey;

    if (this._client?.initialised) {
      //Already initialised, set the state based on the new context, allow certain context props to be optional
      const defaultState = {
        ...this._client.getState(),
        identity: undefined,
        traits: {},
      };
      const isLogout = !!this._client.identity && !identity;
      this._client.identity = identity;
      this._client.setState({
        ...defaultState,
        ...(context || {}),
      });
      this.events.emit(ProviderEvents.Stale, {
        message: 'context has changed',
      });
      return isLogout ? this._client.logout() : this._client.getFlags();
    }

    const serverState = this._config.state;
    if (serverState) {
      this._client.setState(serverState);
      this.events.emit(ProviderEvents.Ready, {
        message: 'flags provided by SSR state',
      });
    }
    return this._client.init({
      ...this._config,
      ...context,
      identity,
      onChange: (previousFlags, params, loadingState) => {
        const eventMeta = {
          metadata: this.getMetadata(),
          flagsChanged: params.flagsChanged,
        };
        this.events.emit(ProviderEvents.Ready, {
          message: 'Flags ready',
          ...eventMeta,
        });
        if (params.flagsChanged) {
          this.events.emit(ProviderEvents.ConfigurationChanged, {
            message: 'Flags changed',
            ...eventMeta,
          });
        }
        this._config.onChange?.(previousFlags, params, loadingState);
      },
    });
  }

  onContextChange(
    oldContext: EvaluationContext,
    newContext: EvaluationContext & Partial<IState>
  ) {
    this.events.emit(ProviderEvents.Stale, { message: 'Context Changed' });
    return this.initialize(newContext);
  }

  resolveBooleanEvaluation(flagKey: string, defaultValue: boolean) {
    return this.evaluate<boolean>(flagKey, 'boolean', defaultValue);
  }

  resolveStringEvaluation(flagKey: string, defaultValue: string) {
    return this.evaluate<string>(flagKey, 'string', defaultValue);
  }

  resolveNumberEvaluation(flagKey: string, defaultValue: number) {
    return this.evaluate<number>(flagKey, 'number', defaultValue);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T
  ) {
    return this.evaluate<T>(flagKey, 'object', defaultValue);
  }

  /**
   * Based on Flagsmith's state, return flag metadata
   * @private
   */
  private getMetadata() {
    return {
      targetingKey: this._client.identity || '',
      ...(this._client.getAllTraits() || {}),
    };
  }

  /**
   * Based on Flagsmith's loading state, determine the Open Feature resolution reason
   * @private
   */
  private evaluate<T extends FlagValue>(
    flagKey: string,
    type: FlagType,
    defaultValue: T
  ) {
    const value = typeFactory(this._client.getValue(flagKey), type);

    if (typeof value !== 'undefined' && typeof value !== type) {
      throw new TypeMismatchError(`flag key ${flagKey} is not of type ${type}`);
    }
    return {
      value: (typeof value !== type ? defaultValue : value) as T,
      reason: this.parseReason(value),
    } as ResolutionDetails<T>;
  }

  /**
   * Based on Flagsmith's loading state and feature resolution, determine the Open Feature resolution reason
   * @private
   */
  private parseReason(value: unknown): ResolutionReason {
    if (value === undefined) {
      return 'DEFAULT';
    }

    switch (this._client.loadingState?.source) {
      case 'CACHE':
        return 'CACHED';
      case 'DEFAULT_FLAGS':
        return 'DEFAULT';
      default:
        return 'STATIC';
    }
  }

  public get flagsmithClient() {
    return this._client;
  }
}
