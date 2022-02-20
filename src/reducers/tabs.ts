import {
  DELETE_TAB,
  LOAD_DEFAULT_REQUEST_METADATA,
  NEW_TAB,
  REFRESH_PROTO_DEFINITIONS,
  SET_ACTIVE_TAB,
  SET_ADDRESS,
  SET_METHOD,
  SET_REQUEST_BODY,
  SET_REQUEST_METADATA,
  SET_RESPONSE_BODY,
  SET_SERVICE,
  SET_THEME,
  TabsActionTypes,
} from '../actiontypes/tabs';
import { Message } from '../types/proto';
import { ProtoDefinitionState, TabsState } from '../types/states';

function getTheme(): string {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const initialState: TabsState = {
  tabs: [],
  activeTab: '',
  protoDefinition: {
    services: [],
    messageTemplates: new Map<string, Message>(),
    root: {},
  },
  theme: getTheme(),
};

interface ServiceMethodMapping {
  [key: string]: string[];
}

interface ServiceProtoPathMapping {
  [key: string]: string;
}

interface ServiceMethodRequestBodyTemplateMapping {
  [key: string]: {
    [key: string]: string,
  };
}

class OptimizedProtoDefinition {
  private _services: string[];
  private _serviceMethods: ServiceMethodMapping;
  private _serviceProtoPath: ServiceProtoPathMapping;
  private _serviceMethodRequestBodyTemplates: ServiceMethodRequestBodyTemplateMapping;

  constructor() {
    this._services = [];
    this._serviceMethods = {};
    this._serviceProtoPath = {};
    this._serviceMethodRequestBodyTemplates = {};
  }

  get services(): string[] {
    return this._services;
  }

  get serviceMethods(): ServiceMethodMapping {
    return this._serviceMethods;
  }

  get serviceProtoPath(): ServiceProtoPathMapping {
    return this._serviceProtoPath;
  }

  get serviceMethodRequestBodyTemplates(): ServiceMethodRequestBodyTemplateMapping {
    return this._serviceMethodRequestBodyTemplates;
  }

  refreshDefinitions(protoDefinition: ProtoDefinitionState) {
    this._services = [];
    this._serviceMethods = {};
    this._serviceProtoPath = {};
    this._serviceMethodRequestBodyTemplates = {};

    protoDefinition.services.forEach(service => {
      this._services.push(service.name);
      this._serviceMethods[service.name] = [];
      this._serviceProtoPath[service.name] = service.protoFile;
      this._serviceMethodRequestBodyTemplates[service.name] = {};

      service.methods.forEach(method => {
        this._serviceMethods[service.name].push(method.name);
        this._serviceMethodRequestBodyTemplates[service.name][method.name] = method.requestBodyTemplate;
      });
    });
  }
}

const optimizedRpcData = new OptimizedProtoDefinition();

export default function tabsReducer(state = initialState, action: TabsActionTypes): TabsState {
  console.info(state, action);
  switch (action.type) {
    case NEW_TAB:
      return {
        ...state,
        tabs: [...state.tabs, {
          id: action.id,
          service: '',
          address: '',
          method: '',
          metadata: '{}',
          requestBody: '',
          responseBody: '',
          rpcMetadata: {
            protoPath: '',
            methods: [],
            requestBodyTemplate: '',
          },
        }],
        activeTab: action.id,
      };
    case SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.id,
      };
    case DELETE_TAB:
      return {
        ...state,
        tabs: state.tabs.filter(tab => tab.id !== action.id),
        activeTab: action.id === state.activeTab ? '' : state.activeTab,
      };
    case SET_SERVICE:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          let method = tab.method;
          if (action.service !== tab.service) {
            method = '';
          }

          return {
            ...tab,
            service: action.service,
            method,
            rpcMetadata: {
              ...tab.rpcMetadata,
              protoPath: optimizedRpcData.serviceProtoPath[action.service] ?? '',
              methods: optimizedRpcData.serviceMethods[action.service] ?? [],
              requestBodyTemplate: '',
            },
          };
        }),
      };
    case SET_ADDRESS:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          return {
            ...tab,
            address: action.address,
          };
        }),
      };
    case SET_METHOD:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          let requestBody = tab.requestBody;
          const requestBodyTemplate = optimizedRpcData.serviceMethodRequestBodyTemplates?.[tab.service]?.[action.method] ?? '';
          if (action.method !== tab.method) {
            requestBody = requestBodyTemplate;
          }

          return {
            ...tab,
            method: action.method,
            requestBody,
            rpcMetadata: {
              ...tab.rpcMetadata,
              requestBodyTemplate,
            },
          };
        }),
      };
    case SET_REQUEST_METADATA:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          return {
            ...tab,
            metadata: action.metadata,
          };
        }),
      };
    case LOAD_DEFAULT_REQUEST_METADATA:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          return {
            ...tab,
            requestBody: tab.rpcMetadata.requestBodyTemplate,
          };
        }),
      };
    case SET_REQUEST_BODY:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          return {
            ...tab,
            requestBody: action.body,
          };
        }),
      };
    case SET_RESPONSE_BODY:
      return {
        ...state,
        tabs: state.tabs.map(tab => {
          if (tab.id !== action.id) {
            return tab;
          }

          return {
            ...tab,
            responseBody: action.body,
          };
        }),
      };
    case REFRESH_PROTO_DEFINITIONS:
      optimizedRpcData.refreshDefinitions(action.protoDefinition);

      return {
        ...state,
        protoDefinition: action.protoDefinition,
      };
    case SET_THEME:
      return {
        ...state,
        theme: action.theme,
      };
    default:
      return state;
  }
}
