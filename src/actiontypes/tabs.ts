import { ProtoDefinitionState } from '../types/states';

export const NEW_TAB = 'NEW_TAB';
export const SET_ACTIVE_TAB = 'SET_ACTIVE_TAB';
export const DELETE_TAB = 'DELETE_TAB';

export const SET_SERVICE = 'SET_SERVICE';
export const SET_ADDRESS = 'SET_ADDRESS';
export const SET_METHOD = 'SET_METHOD';
export const SET_REQUEST_METADATA = 'SET_REQUEST_METADATA';
export const LOAD_DEFAULT_REQUEST_METADATA = 'LOAD_DEFAULT_REQUEST_METADATA';
export const SET_REQUEST_BODY = 'SET_REQUEST_BODY';
export const SET_RESPONSE_BODY = 'SET_RESPONSE_BODY';

export const REFRESH_PROTO_DEFINITIONS = 'REFRESH_PROTO_DEFINITIONS';

export const SET_THEME = 'SET_THEME';

export interface NewTabActionType {
  type: typeof NEW_TAB;
  id: string;
}

export interface SetActiveTabActionType {
  type: typeof SET_ACTIVE_TAB;
  id: string;
}

export interface DeleteTabActionType {
  type: typeof DELETE_TAB;
  id: string;
}

export interface SetServiceActionType {
  type: typeof SET_SERVICE;
  id: string;
  service: string;
}

export interface SetAddressActionType {
  type: typeof SET_ADDRESS;
  id: string;
  address: string;
}

export interface SetMethodActionType {
  type: typeof SET_METHOD;
  id: string;
  method: string;
}

export interface SetRequestMetadataActionType {
  type: typeof SET_REQUEST_METADATA;
  id: string;
  metadata: string;
}

export interface LoadDefaultRequestMetadataActionType {
  type: typeof LOAD_DEFAULT_REQUEST_METADATA;
  id: string;
}

export interface SetRequestBodyActionType {
  type: typeof SET_REQUEST_BODY;
  id: string;
  body: string;
}

export interface SetResponseBodyActionType {
  type: typeof SET_RESPONSE_BODY;
  id: string;
  body: string;
}

export interface RefreshProtoDefinitionsActionType {
  type: typeof REFRESH_PROTO_DEFINITIONS;
  protoDefinition: ProtoDefinitionState;
}

export interface SetThemeActionType {
  type: typeof SET_THEME,
  theme: string;
}

export type GrpcRequestActionTypes =
  SetServiceActionType
  | SetAddressActionType
  | SetMethodActionType
  | SetRequestMetadataActionType
  | LoadDefaultRequestMetadataActionType
  | SetRequestBodyActionType
  | SetResponseBodyActionType;

export type TabsActionTypes =
  NewTabActionType
  | SetActiveTabActionType
  | DeleteTabActionType
  | GrpcRequestActionTypes
  | RefreshProtoDefinitionsActionType
  | SetThemeActionType;
