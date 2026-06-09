import { APIGatewayProxyEventV2, APIGatewayProxyResult, Context } from 'aws-lambda';
import { RestRequest } from 'iot-rest/src/schema';

import { buildRequestContext, deviceService } from './context';
import { handleRequest } from './handlers/device';

export const handle = async (
    event: APIGatewayProxyEventV2,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const restRequest: RestRequest = {
        method: event.requestContext.http.method,
        path: event.rawPath ?? event.requestContext.http.path,
        body: event.body,
        queryStringParameters: event.queryStringParameters
    };

    const response = await handleRequest(restRequest, {
        deviceService,
        requestContext: buildRequestContext(context)
    });

    return response;
};
