import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const prerender = false;

type LastfmTrack = {
  name: string;
  url: string;
  artist: { "#text": string };
  "@attr"?: { nowplaying?: string };
};

export const GET: RequestHandler = async ({ fetch, setHeaders }) => {
  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    user: env.LASTFM_USER ?? "",
    api_key: env.LASTFM_API_KEY ?? "",
    format: "json",
    limit: "1",
  });

  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!res.ok) return json(null, { status: 502 });

  const data = await res.json();
  const track: LastfmTrack | undefined = data.recenttracks?.track?.[0];
  if (!track) return json(null, { status: 404 });

  setHeaders({ "cache-control": "public, s-maxage=30, stale-while-revalidate=60" });

  return json({
    name: track.name,
    artist: track.artist["#text"],
    url: track.url,
    nowPlaying: track["@attr"]?.nowplaying === "true",
  });
};
