// Local-only synthetic fixture for inspecting the actual client components.
// No production auth bypass, real database, stored credentials or network sends.
const esbuild = require("esbuild");
const http = require("node:http");
const fs = require("node:fs");
(async () => {
  const result = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {ReviewFeedback, OwnerFeedbackInbox} from './src/components/review-feedback'; createRoot(document.getElementById('root')).render(location.pathname === '/inbox' ? <OwnerFeedbackInbox /> : <ReviewFeedback ready owner />);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "next-fixture-elements", setup(build) {
      build.onResolve({ filter: /^next\/(link|image)$/ }, args => ({ path: args.path, namespace: "fixture" }));
      build.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: `import React from 'react'; export default function Element({children,unoptimized,...props}) { return React.createElement(${args.path.endsWith("link") ? '"a"' : '"img"'}, props, children); }`, resolveDir: process.cwd() }));
    } }],
  });
  const js = result.outputFiles[0].text;
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  const records = []; const attempts = []; let failedOnce = false;
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1:3016");
    const json = (value, status=200) => { res.writeHead(status, {"Content-Type":"application/json"}); res.end(JSON.stringify(value)); };
    if (url.pathname === "/component.js") { res.writeHead(200, {"Content-Type":"text/javascript"}); return res.end(js); }
    if (url.pathname === "/synthetic-state") return json({ attempts, records });
    if (url.pathname === "/api/feedback") {
      if (req.method === "GET") return json({items:records,more:false});
      const chunks=[]; for await (const chunk of req) chunks.push(chunk);
      const input=JSON.parse(Buffer.concat(chunks).toString());
      if (req.method === "PATCH") { const item=records.find(row=>row.id===input.id); item.reviewed=input.reviewed; return json({id:item.id,reviewed:item.reviewed}); }
      attempts.push(input);
      if (!failedOnce) { failedOnce=true; return json({error:"Synthetic failure. Your message is still here."},503); }
      if (!records.some(row=>row.id===input.id)) records.push({...input,created_at:new Date().toISOString(),reviewed:false});
      return json({sent:true});
    }
    if (url.pathname.startsWith("/brand/")) { const target="public"+url.pathname; res.writeHead(200,{"Content-Type":"image/webp"}); return fs.createReadStream(target).pipe(res); }
    res.writeHead(200,{"Content-Type":"text/html"});
    res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic feedback component check</title><style>${css}</style></head><body><div id="root"></div><script src="/component.js"></script></body></html>`);
  });
  server.listen(3016,"127.0.0.1",()=>console.log("Synthetic feedback fixture on http://127.0.0.1:3016"));
})().catch(error=>{console.error(error);process.exitCode=1;});
