export interface Capture {
  id: string;
  environmentId: string;
  method: string;
  url: string;
  pathname: string;
  statusCode: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  capturedAt: number;
}
