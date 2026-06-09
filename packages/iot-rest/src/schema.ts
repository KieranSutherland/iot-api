export interface RestRequest {
    method: string;
    path: string;
    body?: unknown;
    queryStringParameters?: Record<string, string | undefined> | null;
}

export interface RestResponse {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
}

