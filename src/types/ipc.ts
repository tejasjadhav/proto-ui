export const IPC_LOAD_PROTO = 'load-proto';
export const IPC_EXECUTE_GRPC_REQUEST = 'execute-grpc-request';

export const IPC_PROTO_MANAGER_GET_SERVICES = 'get-services';
export const IPC_PROTO_MANAGER_GET_METHOD_DEFINITION = 'get-method-definition';

export const IPC_GRPC_CLIENT_EXECUTE_REQUEST = 'execute-request';

export interface Method {
  name: string;
  fullyQualifiedName: string;
}

export interface Service {
  name: string;
  fullyQualifiedName: string;
  protoFile: string;
  methodNames: Method[];
}

export interface MethodDefinitionRequest {
  protoFile: string;
  fullyQualifiedServiceName: string;
  fullyQualifiedMethodName: string;
}

export interface MethodDefinition {
  fullyQualifiedRequestBodyName: string;
  requestBodyTemplate: string;
}

export interface GrpcCallRequest {
  protoFile: string;
  fullyQualifiedServiceName: string;
  fullyQualifiedMethodName: string;
  fullyQualifiedRequestBodyMessageName: string;

  address: string;
  requestMetadata: string;
  requestBody: string;
}
