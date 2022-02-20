import * as fs from 'fs';
import { Error, ErrorCode, Response } from '../../src/contract/common';
import { AddPathResponse, RemovePathResponse } from '../../src/contract/ProtoManager';
import { Service } from '../../src/types/ipc';
import { MessageFields } from '../../src/types/proto';
import { CommonSourceRoot } from '../proto/CommonSourceRoot';

interface ProtoDataStore {
  [protoFile: string]: {
    [messageName: string]: MessageFields
  }
}

export default class ProtoManager {
  private readonly importPaths: Set<string>;
  private readonly sourceProtoPaths: Set<string>;
  private readonly _dataStore: ProtoDataStore;
  private _protoRoot: CommonSourceRoot | null;

  constructor(importPaths: Set<string> = new Set<string>(), sourceProtoPaths: Set<string> = new Set<string>()) {
    this.importPaths = importPaths;
    this.sourceProtoPaths = sourceProtoPaths;
    this._dataStore = {};
    this._protoRoot = null;
  }

  private async getProtoRoot(): Promise<CommonSourceRoot> {
    if (this._protoRoot === null) {
      this._protoRoot = new CommonSourceRoot(this.importPaths);
      await this._protoRoot?.load(Array.from(this.sourceProtoPaths));
    }

    return this._protoRoot;
  }

  get dataStore(): ProtoDataStore {
    return this._dataStore;
  }

  addImportPath(path: string): Response<AddPathResponse> {
    if (!fs.existsSync(path)) {
      return {
        success: false,
        error: new Error(ErrorCode.PATH_DOES_NOT_EXIST, `${path} does not exist`),
      };
    }

    this.importPaths.add(path);
    return {
      success: true,
    };
  }

  removeImportPath(path: string): Response<RemovePathResponse> {
    this.importPaths.delete(path);
    return {
      success: true,
    };
  }

  async loadProtoFile(path: string): Promise<Response<undefined>> {
    if (!fs.existsSync(path)) {
      return {
        success: false,
        error: new Error(ErrorCode.PATH_DOES_NOT_EXIST, `${path} does not exist`),
      };
    }

    const root = new CommonSourceRoot(this.importPaths);
    await root.load(path);
    root.loadMessageTemplates();
    root.messageTemplates.forEach(((message, messageName) => {
      if (!this._dataStore.hasOwnProperty(message.protoFile)) this._dataStore[message.protoFile] = {};
      this._dataStore[message.protoFile][messageName] = message.fields;
    }));

    return {
      success: true,
    };
  }

  async getServices(): Promise<Response<Service[]>> {
    const protoRoot = await this.getProtoRoot();
    return {
      success: true,
      data: protoRoot.getServices().map((serviceDefinition): Service => {
        let service = protoRoot.lookupService(serviceDefinition.name);
        return {
          name: serviceDefinition.name,
          fullyQualifiedName: service.fullName,
          protoFile: serviceDefinition.protoFile,
          methodNames: service.methodsArray.map(method => ({
            name: method.name,
            fullyQualifiedName: method.fullName,
          })),
        };
      }),
    };
  }
}
