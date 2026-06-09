import { DeviceService } from 'iot-core';
import { RequestContext } from 'iot-spi';

export interface RestContext {
    deviceService: DeviceService;
    requestContext: RequestContext;
}
