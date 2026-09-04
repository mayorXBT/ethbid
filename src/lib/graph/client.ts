import { serverEnv } from "../env";

export function graphConfigured(): boolean {
  return Boolean(serverEnv("GRAPH_SUBGRAPH_URL"));
}

export function graphEndpoint(): string {
  const url = serverEnv("GRAPH_SUBGRAPH_URL");
  if (!url) {
    throw new Error("GRAPH_SUBGRAPH_URL is missing. The leaderboard cannot query The Graph yet.");
  }
  return url;
}

export async function graphQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const key = serverEnv("GRAPH_API_KEY");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(graphEndpoint(), {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || body.errors?.length) {
    throw new Error(body.errors?.[0]?.message || `Graph query failed (${res.status}).`);
  }
  if (!body.data) throw new Error("Graph query returned no data.");
  return body.data;
}
