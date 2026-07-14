export type HealthResponse = {
  app: "ok";
  database: "ok" | "error";
  checkedAt: string;
};

export function createHealthResponse(databaseAvailable: boolean, checkedAt = new Date()): HealthResponse {
  return {
    app: "ok",
    database: databaseAvailable ? "ok" : "error",
    checkedAt: checkedAt.toISOString(),
  };
}
