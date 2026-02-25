import { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  const store = getStore("church_data");
  const url = new URL(req.url);
  const path = url.pathname;

  // Simple routing for /api/data
  if (path.endsWith("/data")) {
    if (req.method === "GET") {
      try {
        const data = await store.get("app_db", { type: "json" });
        if (!data) {
          return new Response(JSON.stringify({
            youth: [],
            attendance: [],
            marathons: [],
            marathonGroups: [],
            marathonPoints: [],
            servants: [],
            config: {
              churchName: 'كنيسة الملاك روفائيل',
              meetingName: 'اجتماع ثانوي بنين',
              adminPassword: 'kerolos0',
              grades: ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي']
            },
            updatedAt: new Date().toISOString()
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 });
      }
    }

    if (req.method === "POST") {
      try {
        const body = await req.json();
        body.updatedAt = new Date().toISOString();
        await store.setJSON("app_db", body);
        return new Response(JSON.stringify({ success: true, updatedAt: body.updatedAt }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to save data" }), { status: 500 });
      }
    }
  }

  return new Response("Not Found", { status: 404 });
};
