## Backend

### Proto manager
#### Get services

##### Response
```typescript
interface Service {
  name: string;
  fullyQualifiedName: string;
  protoFile: string;
  methodNames: string[];
}

interface ServiceListResponse {
  success: boolean;
  data: Service[];
}
```

#### Get method definition
##### Request
```typescript
interface MethodDefinitionRequest {
  protoFile: string;
  fullyQualifiedServiceName: string;
  fullyQualifiedMethodName: string;
}
```

##### Response
```typescript
interface MethodDefinition {
  fullyQualifiedRequestBodyName: string;
  requestBodyTemplate: string;
}

interface MethodDefinitionResponse {
  success: boolean;
  data: MethodDefinition;
}
```


### gRPC client
#### Make gRPC request
##### Request
```typescript
interface GrpcCallRequest {
  protoFile: string;
  fullyQualifiedServiceName: string;
  fullyQualifiedMethodName: string;
  fullyQualifiedRequestBodyMessageName: string;

  address: string;
  requestMetadata: string;
  requestBody: string; 
}
```

##### Response
```typescript
interface GrpcCallResponse {
  success: boolean;
  data: any;
}
```
