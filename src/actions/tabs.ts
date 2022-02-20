import { v4 as uuidV4 } from 'uuid';
import {
  DELETE_TAB,
  DeleteTabActionType,
  LOAD_DEFAULT_REQUEST_METADATA,
  LoadDefaultRequestMetadataActionType,
  NEW_TAB,
  NewTabActionType,
  REFRESH_PROTO_DEFINITIONS,
  RefreshProtoDefinitionsActionType,
  SET_ACTIVE_TAB,
  SET_ADDRESS,
  SET_METHOD,
  SET_REQUEST_BODY,
  SET_REQUEST_METADATA,
  SET_RESPONSE_BODY,
  SET_SERVICE,
  SET_THEME,
  SetActiveTabActionType,
  SetAddressActionType,
  SetMethodActionType,
  SetRequestBodyActionType,
  SetRequestMetadataActionType,
  SetResponseBodyActionType,
  SetServiceActionType,
  SetThemeActionType,
} from '../actiontypes/tabs';
import { ProtoDefinitionState } from '../types/states';

export function newTab(): NewTabActionType {
  return {
    type: NEW_TAB,
    id: uuidV4().toString(),
  };
}

export function setActiveTab(id: string): SetActiveTabActionType {
  return {
    type: SET_ACTIVE_TAB,
    id: id,
  };
}

export function deleteTab(id: string): DeleteTabActionType {
  return {
    type: DELETE_TAB,
    id: id,
  };
}

export function setService(id: string, service: string): SetServiceActionType {
  return {
    type: SET_SERVICE,
    id,
    service,
  };
}

export function setAddress(id: string, address: string): SetAddressActionType {
  return {
    type: SET_ADDRESS,
    id,
    address,
  };
}

export function setMethod(id: string, method: string): SetMethodActionType {
  return {
    type: SET_METHOD,
    id,
    method,
  };
}

export function setRequestMetadata(id: string, metadata: string): SetRequestMetadataActionType {
  return {
    type: SET_REQUEST_METADATA,
    id,
    metadata,
  };
}

export function loadDefaultRequestMetadata(id: string): LoadDefaultRequestMetadataActionType {
  return {
    type: LOAD_DEFAULT_REQUEST_METADATA,
    id,
  };
}

export function setRequestBody(id: string, body: string): SetRequestBodyActionType {
  return {
    type: SET_REQUEST_BODY,
    id,
    body,
  };
}

export function setResponseBody(id: string, body: string): SetResponseBodyActionType {
  return {
    type: SET_RESPONSE_BODY,
    id,
    body,
  };
}

export function refreshProtoDefinitions(protoDefinition: ProtoDefinitionState): RefreshProtoDefinitionsActionType {
  return {
    type: REFRESH_PROTO_DEFINITIONS,
    protoDefinition,
  };
}

export function setTheme(theme: string): SetThemeActionType {
  return {
    type: SET_THEME,
    theme,
  };
}
