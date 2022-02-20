import * as Path from 'path';
import { Service } from '../../src/types/ipc';
import ProtoManager from './ProtoManager';
import { Response } from '../../src/contract/common';

describe('get services', () => {
  it('should fetch existing services from proto file', async () => {
    const greeterProtoFile = Path.resolve(__dirname + '../../../fixtures/greeter/service.proto');
    const protoManager = new ProtoManager(new Set(), new Set([
      greeterProtoFile,
    ]));

    const services = await protoManager.getServices();
    const expectedResponse: Response<Service[]> = {
      success: true,
      data: [
        {
          name: 'GreetersService',
          fullyQualifiedName: '.protoui.sample.greeter.GreetersService',
          protoFile: greeterProtoFile,
          methodNames: [
            {
              name: 'SayHello',
              fullyQualifiedName: '.protoui.sample.greeter.GreetersService.SayHello',
            },
          ],
        },
      ],
    };

    expect(services).toStrictEqual(expectedResponse);
  });
});
