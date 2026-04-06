export interface MockRule {
  id: string;
  captureId: string | null;
  targetEnvironmentId: string;
  method: string;
  pathname: string;
  enabled: boolean;
  mode: "full" | "partial";
  responseBody: string;
  overrides: Record<string, unknown> | null;
  statusCode: number;
  createdAt: number;
}
