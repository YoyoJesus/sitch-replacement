import { Elysia } from "elysia";
import { readFileSync } from "fs";
import { join } from "path";

const app = new Elysia()
  .get("/styles.css", () => {
    const styles = readFileSync(join(__dirname, "styles.css"), "utf-8");
    return new Response(styles, {
      headers: {
        'Content-Type': 'text/css'
      }
    });
  })
  .get("/Static/:filename", ({ params }) => {
    const file = readFileSync(join(__dirname, "Static", params.filename));
    return new Response(file, {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    });
  })
  .get("/", () => {
    const html = readFileSync(join(__dirname, "index.html"), "utf-8");
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  });

export default app;
