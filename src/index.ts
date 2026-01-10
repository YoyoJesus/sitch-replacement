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
  .get("/contact.js", () => {
    const contactScript = readFileSync(join(__dirname, "contact.js"), "utf-8");
    // Inject environment variables
    const scriptWithEnv = `
      const VITE_EMAILJS_SERVICE_ID = "${process.env.VITE_EMAILJS_SERVICE_ID || ''}";
      const VITE_EMAILJS_TEMPLATE_ID = "${process.env.VITE_EMAILJS_TEMPLATE_ID || ''}";
      const VITE_EMAILJS_PUBLIC_KEY = "${process.env.VITE_EMAILJS_PUBLIC_KEY || ''}";
      
      ${contactScript.replace(/import\.meta\.env\.VITE_EMAILJS_SERVICE_ID/g, 'VITE_EMAILJS_SERVICE_ID')
                     .replace(/import\.meta\.env\.VITE_EMAILJS_TEMPLATE_ID/g, 'VITE_EMAILJS_TEMPLATE_ID')
                     .replace(/import\.meta\.env\.VITE_EMAILJS_PUBLIC_KEY/g, 'VITE_EMAILJS_PUBLIC_KEY')}
    `;
    return new Response(scriptWithEnv, {
      headers: {
        'Content-Type': 'application/javascript'
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
