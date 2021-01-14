import { Message, MessageFields, ServiceDefinition } from './proto';

export interface RpcMetadataState {
  protoPath: string,
  methods: string[];
  requestBodyTemplate: string;
}

export interface TabState {
  id: string;
  service: string;
  address: string;
  method: string;
  metadata: string;
  requestBody: string;
  rpcMetadata: RpcMetadataState;
  responseBody: string;
}

export interface ProtoDefinitionState {
  services: ServiceDefinition[];
  messageTemplates: Map<string, Message>;
  root: any;
}

export interface TabsState {
  tabs: TabState[];
  activeTab: string;
  protoDefinition: ProtoDefinitionState;
}

