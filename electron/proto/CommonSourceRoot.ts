import * as fs from 'fs';
import * as _ from 'lodash';
import * as Protobuf from 'protobufjs';
import { Service, Type } from 'protobufjs';
import { FieldType, Message, MessageFields, MethodDefinition, ServiceDefinition } from '../../src/types/proto';

export const PROTO_SOURCES: Set<string> = new Set([
  '/Users/tejas/Go/src/source.golabs.io/gopay/gopay_contracts/proto',
  '/Users/tejas/Projects/gopay/gopay-transaction-proto/src/main/proto',
  '/Users/tejas/Projects/protocolbuffers/protobuf/src/google/protobuf',
  '/Users/tejas/Go/src/source.golabs.io/gopay/order-management-service-proto/proto',
  '/Users/tejas/Go/src/source.golabs.io/gopay/gopay_errors/proto',
]);


export class CommonSourceRoot extends Protobuf.Root {
  private _messageTemplates: Map<string, Message>;
  private readonly importPaths: Set<string>;

  constructor(importPaths: Set<string> = new Set<string>()) {
    super();
    this._messageTemplates = new Map<string, Message>();
    this.importPaths = importPaths;
  }

  get messageTemplates(): Map<string, Message> {
    return this._messageTemplates;
  }

  resolvePath(origin: string, target: string): string | null {
    const originalPath = super.resolvePath(origin, target) ?? '';
    if (fs.existsSync(originalPath)) {
      return originalPath;
    }

    for (let path of this.importPaths) {
      const resolvedPath = Protobuf.util.path.resolve(path + '/', target);
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
    }

    return null;
  }

  getServices(): ServiceDefinition[] {
    return this.getServicesRecursively(this);
  }

  private getServicesRecursively(root: any): ServiceDefinition[] {
    const services: ServiceDefinition[] = [];

    if (!root) {
      return [];
    }

    if (root.methods !== undefined) {
      return [this.getServiceDefinition(root)];
    }

    if (root.nested === undefined) {
      return [];
    }

    Object.values(root.nested).forEach((value) => {
      services.push(...this.getServicesRecursively(value));
    });

    return services;
  }

  private getServiceDefinition(service: Service): ServiceDefinition {
    return {
      name: service.name,
      protoFile: service.filename ?? '',
      methods: this.getMethodDefinitions(service),
    };
  }

  private getMethodDefinitions(service: Service): MethodDefinition[] {
    return _.sortBy(service.methodsArray, m => m.name)
      .map(method => ({
        name: method.name,
        requestMessage: method.requestType,
        responseMessage: method.responseType,
        requestBodyTemplate: JSON.stringify(this.getZeroValueForMessageType(this.lookupType(method.requestType).fullName), null, 2),
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
        protoFile: root.filename,
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
        protoFile: root.filename,
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
    const fields: MessageFields = {};
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

  private getZeroValueForMessageType(messageType: string): any {
    const message = this.resolveMessageType(messageType);
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

  private resolveMessageType(messageType: string): Message | undefined {
    return this._messageTemplates.get(messageType);
  }
}
