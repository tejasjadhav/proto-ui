import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import * as isDev from 'electron-is-dev';
import * as fs from 'fs';
import * as grpc from 'grpc';
import { Client, Metadata } from 'grpc';
import * as _ from 'lodash';
import * as path from 'path';
import * as Protobuf from 'protobufjs';
import { Field, Method, Service, Type, util } from 'protobufjs';
import * as Util from 'util';
import { IPC_EXECUTE_GRPC_REQUEST, IPC_LOAD_PROTO } from '../src/types/ipc';
import {
  FieldType,
  GrpcRequest,
  Message,
  MessageFields,
  MethodDefinition,
  ServiceDefinition,
} from '../src/types/proto';
import { ProtoDefinitionState } from '../src/types/states';

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  win.maximize();
  win.show();

  if (isDev) {
    win.loadURL('http://localhost:3000/index.html');
  } else {
    // 'build/index.html'
    win.loadURL(`file://${__dirname}/../index.html`);
  }

  win.on('closed', () => win = null);

  // Hot Reloading
  if (isDev) {
    // 'node_modules/.bin/electronPath'
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
      forceHardReset: true,
      hardResetMethod: 'exit',
    });
  }

  // DevTools
  installExtension(REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

function consoledir(obj: any) {
  console.log(Util.inspect(obj, { showHidden: false, depth: null, colors: true }));
}

const PROTO_SOURCES = new Map<string, string>();
PROTO_SOURCES.set('country.proto', '/Users/tejas/Go/src/source.golabs.io/gopay/gopay_contracts/proto/country.proto');
PROTO_SOURCES.set('transaction.proto', '/Users/tejas/Projects/gopay/gopay-transaction-proto/src/main/proto/transaction.proto');
PROTO_SOURCES.set('timestamp.proto', '/Users/tejas/Projects/protocolbuffers/protobuf/src/google/protobuf/timestamp.proto');

class CommonSourceRoot extends Protobuf.Root {
  private static standardProtoTypes = new Set([
    'double',
    'float',
    'int32',
    'int64',
    'uint32',
    'uint64',
    'sint32',
    'sint64',
    'fixed32',
    'fixed64',
    'sfixed32',
    'sfixed64',
    'bool',
    'string',
    'bytes',
  ]);
  private _messageTemplates: Map<string, Message>;

  constructor() {
    super();
    this._messageTemplates = new Map<string, Message>();
  }

  get messageTemplates(): Map<string, Message> {
    return this._messageTemplates;
  }

  resolvePath(origin: string, target: string): string | null {
    const originalPath = super.resolvePath(origin, target) ?? '';
    if (fs.existsSync(originalPath)) {
      return originalPath;
    }

    return PROTO_SOURCES.get(target) ?? null;
  }

  getServices(): ServiceDefinition[] {
    return this.getServicesRecursively(this);
  }

  private getServicesRecursively(root: any, namespace: string = ''): ServiceDefinition[] {
    const services: ServiceDefinition[] = [];

    if (!root) {
      return [];
    }

    if (root.methods !== undefined) {
      return [this.getServiceDefinition(root, namespace)];
    }

    if (root.nested === undefined) {
      return [];
    }

    if (namespace !== '') {
      namespace = `${namespace}.${root.name}`;
    } else {
      namespace = `${root.name}`;
    }

    Object.values(root.nested).forEach((value) => {
      services.push(...this.getServicesRecursively(value, namespace));
    });

    return services;
  }

  private getServiceDefinition(service: Service, namespace: string): ServiceDefinition {
    return {
      name: service.name,
      protoFile: service.filename ?? '',
      methods: this.getMethodDefinitions(service, namespace),
    };
  }

  private getMethodDefinitions(service: Service, namespace: string): MethodDefinition[] {
    return _.sortBy(service.methodsArray, m => m.name)
      .map(method => ({
        name: method.name,
        requestMessage: method.requestType,
        responseMessage: method.responseType,
        requestBodyTemplate: JSON.stringify(this.getZeroValueForMessageType(method.requestType, namespace), null, 2),
      }));
  }

  loadMessageTemplates() {
    this._messageTemplates = this.getMessageTemplatesRecursively(this);
  }

  private getMessageTemplatesRecursively(root: any): Map<string, Message> {
    const messageTemplates = new Map<string, Message>();
    if (!root) {
      return messageTemplates;
    }

    if (root.fields !== undefined) {
      // @ts-ignore
      messageTemplates.set(root.fullName, {
        fields: CommonSourceRoot.getTemplateFromFields(root),
      });
    }

    if (root.values !== undefined && !(root.values instanceof Function)) {
      messageTemplates.set(root.fullName, {
        fields: {
          '<default>': {
            type: 'enum',
            repeated: root.repeated,
            values: root.valuesById,
          },
        },
      });
    }

    if (root.nested) {
      Object.entries(root.nested)
        .filter(([__, value]) => !!value)
        .filter(([key, __]) => key !== 'parent')
        .forEach(([__, value]) => {
          this.getMessageTemplatesRecursively(value).forEach((template, messageType) => {
            messageTemplates.set(messageType, template);
          });
        });
    }

    return messageTemplates;
  }

  private static getTemplateFromFields(type: Type): MessageFields {
    const fields = {};
    Object.entries(type.fields).forEach(([field, fieldDescription]) => {
      fieldDescription.resolve();
      // @ts-ignore
      fields[_.snakeCase(field)] = {
        type: fieldDescription.resolvedType?.fullName ?? fieldDescription.type,
        repeated: fieldDescription.repeated,
      };
    });
    return fields;
  }

  private getZeroValueForMessageType(messageType: string, namespace: string = ''): any {
    const message = this.resolveMessageType(messageType, namespace);
    if (!message) {
      return {};
    }

    return this.getZeroValueForMessage(message);
  }

  private getZeroValueForMessage(message: Message): any {
    if ('<default>' in message.fields) {
      return this.getZeroValueForType(message.fields['<default>']);
    }

    const zeroValueObject = {};
    Object.entries(message.fields).forEach(([key, value]) => {
      // @ts-ignore
      zeroValueObject[key] = this.getZeroValueForType(value);
    });

    return zeroValueObject;
  }

  private getZeroValueForType(field: FieldType): any {
    let result;

    switch (field.type) {
      case 'enum':
        result = field.values?.[0] ?? '';
        break;
      case 'double':
      case 'float':
        result = 0.0;
        break;
      case 'int32':
      case 'int64':
      case 'uint32':
      case 'uint64':
      case 'sint32':
      case 'sint64':
      case 'fixed32':
      case 'fixed64':
      case 'sfixed32':
      case 'sfixed64':
        result = 0;
        break;
      case 'bool':
        result = false;
        break;
      case 'string':
      case 'bytes':
        result = '';
        break;
      default:
        result = this.getZeroValueForMessageType(field.type);
        break;
    }

    if (field.repeated) {
      return [result];
    }

    return result;
  }

  private resolveMessageType(messageType: string, namespace: string): Message | undefined {
    return _.head([
      messageType,
      `.${messageType}`,
      `${namespace}.${messageType}`,
      `.${namespace}.${messageType}`,
    ]
      .filter(key => this._messageTemplates.has(key))
      .map(key => this._messageTemplates.get(key)));
  }
}

ipcMain.handle(IPC_LOAD_PROTO, (async (event: IpcMainInvokeEvent, protoPath: string): Promise<ProtoDefinitionState> => {
  const root = new CommonSourceRoot();
  await root.load(protoPath);
  root.loadMessageTemplates();

  return {
    services: root.getServices(),
    messageTemplates: root.messageTemplates,
    root: null,
  };
}));

function makeGrpcCall(client: Client, qualifiedMethodName: string, requestData: Uint8Array, metadata: Metadata): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    client.makeUnaryRequest(
      qualifiedMethodName,
      // @ts-ignore
      arg => arg,
      // @ts-ignore
      arg => arg,
      requestData,
      metadata,
      null,
      ((error, value) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(value ?? new Buffer(''));
      }),
    );
  });
}

ipcMain.handle(IPC_EXECUTE_GRPC_REQUEST, (async (event: IpcMainInvokeEvent, grpcRequest: GrpcRequest) => {
  // TODO: Replace with Protobuf.js with https://www.npmjs.com/package/@grpc/proto-loader
  // gRPC client setup
  const Client = grpc.makeGenericClientConstructor({}, '', {});
  const client = new Client(
    grpcRequest.address,
    grpc.credentials.createInsecure(),
  );

  // Load definitions from proto files
  const root = new CommonSourceRoot();
  await root.load(grpcRequest.protoPath, { keepCase: true });

  // Generate fully qualified method name
  const serviceDefinition = root.lookupService(grpcRequest.service);
  const methodDefinition = getMethodFromService(serviceDefinition, grpcRequest.method);
  const namespace = getNamespace(serviceDefinition)
    .filter(s => s !== '')
    .join('.');
  const qualifiedMethodName = `/${namespace}/${methodDefinition?.name}`;

  // Encode request data in gRPC format
  const requestMessageType = methodDefinition?.requestType;
  const requestMessageTypeDefinition = root.lookupType(requestMessageType ?? '');
  const encodedRequestData = requestMessageTypeDefinition.encode(requestMessageTypeDefinition.fromObject(grpcRequest.requestBody)).finish();

  // Create gRPC metadata
  const grpcMetadata = new grpc.Metadata();
  Object.entries(grpcRequest.requestMetadata).forEach(([key, value]) => {
    // @ts-ignore
    grpcMetadata.add(key, value);
  });

  // Make gRPC call
  const encodedResponseData = await makeGrpcCall(
    client,
    qualifiedMethodName,
    encodedRequestData,
    grpcMetadata,
  );

  // Decode the gRPC data into response
  const responseMessageType = methodDefinition?.responseType;
  const responseMessageTypeDefinition = root.lookupType(responseMessageType ?? '');
  return responseMessageTypeDefinition.toObject(responseMessageTypeDefinition.decode(encodedResponseData), { enums: String });
}));

function getMethodFromService(service: Service, method: string): Method | null {
  return service.methodsArray.find(value => value.name === method) ?? null;
}

function getNamespace(service: any): string[] {
  if (!service) {
    return [];
  }

  return [...getNamespace(service.parent), service.name];
}
