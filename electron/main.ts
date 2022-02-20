import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, Menu } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import * as isDev from 'electron-is-dev';
import * as grpc from 'grpc';
import { Client, Metadata } from 'grpc';
import * as path from 'path';
import { Method, Service } from 'protobufjs';
import * as Util from 'util';
import { Response } from '../src/contract/common';
import {
  IPC_EXECUTE_GRPC_REQUEST,
  IPC_LOAD_PROTO,
  IPC_PROTO_MANAGER_GET_SERVICES,
  Service as IpcService,
} from '../src/types/ipc';
import { GrpcRequest } from '../src/types/proto';
import { ProtoDefinitionState } from '../src/types/states';
import { CommonSourceRoot, PROTO_SOURCES } from './proto/CommonSourceRoot';
import ProtoManager from './protomanager/ProtoManager';

let win: BrowserWindow | null = null;

function getBaseUrl(): string {
  if (isDev) {
    return 'http://localhost:3000/index.html';
  }
  // 'build/index.html'
  return `file://${__dirname}/../index.html`;
}

Menu.setApplicationMenu(Menu.buildFromTemplate([
  {
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        label: 'Preferences',
        click: (menuItem, browserWindow) => {
          browserWindow?.loadURL(`${getBaseUrl()}/#proto-manager`);
        },
      },

    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },
]));

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

  win.loadURL(getBaseUrl());

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

ipcMain.handle(IPC_LOAD_PROTO, (async (event: IpcMainInvokeEvent, protoPath: string): Promise<ProtoDefinitionState> => {
  const root = new CommonSourceRoot(PROTO_SOURCES);
  await root.load(protoPath);
  root.loadMessageTemplates();

  const protoManager = new ProtoManager(PROTO_SOURCES);
  await protoManager.loadProtoFile(protoPath);

  return {
    services: root.getServices(),
    messageTemplates: root.messageTemplates,
    root: protoManager.dataStore,
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
  const ClientConstructor = grpc.makeGenericClientConstructor({}, '', {});
  const client = new ClientConstructor(
    grpcRequest.address,
    grpc.credentials.createInsecure(),
  );

  // Load definitions from proto files
  const root = new CommonSourceRoot(PROTO_SOURCES);
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
  return responseMessageTypeDefinition.toObject(responseMessageTypeDefinition.decode(encodedResponseData), {
    enums: String,
    longs: Number,
  });
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

const protoManager = new ProtoManager(PROTO_SOURCES);

ipcMain.handle(IPC_PROTO_MANAGER_GET_SERVICES, (async (event: IpcMainInvokeEvent): Promise<Response<IpcService[]>> => {
  return await protoManager.getServices();
}));
