export interface FieldTypeValues {
  [key: number]: string;
}

export interface FieldType {
  type: string;
  repeated?: true;
  values?: FieldTypeValues;
}

export interface MessageFields {
  [key: string]: FieldType
}

export interface Message {
  fields: MessageFields;
}

export interface MethodDefinition {
  name: string;
  requestMessage: string;
  requestBodyTemplate: string;
  responseMessage: string;
}

export interface ServiceDefinition {
  name: string;
  protoFile: string;
  methods: MethodDefinition[];
}

export interface GrpcRequest {
  address: string;
  service: string;
  protoPath: string;
  method: string;
  requestMetadata: object;
  requestBody: object;
}
