import {
  GrpcRequestActionTypes, LOAD_DEFAULT_REQUEST_METADATA,
  SET_ADDRESS,
  SET_METHOD, SET_REQUEST_BODY,
  SET_REQUEST_METADATA,
  SET_SERVICE,
} from '../actiontypes/tabs';
import { TabState } from '../types/states';

const _rpcData = [
  {
    service: 'OrderManagementService',
    methods: [
      {
        method: 'Create',
        requestBodyTemplate: `{
  "hello": "world"
}`,
      },
      {
        method: 'CreateAndProcess',
        requestBodyTemplate: `{
  "hola": "mundo"
}`,
      },
    ],
  },
  {
    service: 'DirectDebitService',
    methods: [
      {
        method: 'ChargeCard',
        requestBodyTemplate: `{
  "foo": "bar"
}`,
      },
      {
        method: 'CancelCharge',
        requestBodyTemplate: `{
  "boo": "far"
}`,
      },
    ],
  },
];

let optimizedRpcData: any = {
  isPopulated: false,
  services: [],
  serviceMethods: {},
  serviceMethodRequestBodyTemplates: {},
};

function getOptimizedRpcData() {
  if (optimizedRpcData.isPopulated) {
    return optimizedRpcData;
  }

  _rpcData.forEach(service => {
    optimizedRpcData.services.push(service.service);
    optimizedRpcData.serviceMethods[service.service] = [];
    optimizedRpcData.serviceMethodRequestBodyTemplates[service.service] = {};

    service.methods.forEach(method => {
      optimizedRpcData.serviceMethods[service.service].push(method.method);
      optimizedRpcData.serviceMethodRequestBodyTemplates[service.service][method.method] = method.requestBodyTemplate;
    });
  });

  optimizedRpcData.isPopulated = true;
  return optimizedRpcData;
}


export function grpcRequestReducer(state: TabState, action: GrpcRequestActionTypes) {
  let rpcData = getOptimizedRpcData();

  switch (action.type) {
    case SET_SERVICE:
      let method = state.method;
      if (action.service !== state.service) {
        method = '';
      }

      return {
        ...state,
        service: action.service,
        method,
        rpcMetadata: {
          ...state.rpcMetadata,
          methods: rpcData.serviceMethods[action.service] ?? [],
          requestBodyTemplate: '',
        },
      };
    case SET_ADDRESS:
      return {
        ...state,
        address: action.address,
      };
    case SET_METHOD:
      let requestBody = state.requestBody;
      const requestBodyTemplate = rpcData.serviceMethodRequestBodyTemplates?.[state.service]?.[action.method] ?? '';
      if (action.method !== state.method) {
        requestBody = requestBodyTemplate;
      }

      return {
        ...state,
        method: action.method,
        requestBody,
        rpcMetadata: {
          ...state.rpcMetadata,
          requestBodyTemplate,
        },
      };
    case SET_REQUEST_METADATA:
      return {
        ...state,
        metadata: action.metadata,
      };
    case LOAD_DEFAULT_REQUEST_METADATA:
      return {
        ...state,
        requestBody: state.rpcMetadata.requestBodyTemplate,
      };
    case SET_REQUEST_BODY:
      return {
        ...state,
        requestBody: action.body,
      };
  }
}
