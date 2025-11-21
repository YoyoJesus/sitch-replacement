import { Elysia } from "elysia";
import { readFileSync } from "fs";
import { join } from "path";

const html = readFileSync(join(__dirname, "index.html"), "utf-8");
const styles = readFileSync(join(__dirname, "styles.css"), "utf-8");

const app = new Elysia()
  .get("/styles.css", () => {
    return new Response(styles, {
      headers: {
        'Content-Type': 'text/css'
      }
    });
  })
  .get("/", () => {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  });

export default app;
