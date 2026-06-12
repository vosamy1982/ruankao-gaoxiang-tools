import { defineConfig } from 'vite'
import type { ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import formidable from 'formidable'

function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === '/api/save-exam-points' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const dataPath = path.resolve(__dirname, 'src/data/exam-points.json');
              try {
                fs.copyFileSync(dataPath, dataPath + '.bak');
              } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                  throw error;
                }
              }
              fs.writeFileSync(dataPath, JSON.stringify(JSON.parse(body), null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
            }
          });
          return;
        }

        if (req.url === '/api/upload-image' && req.method === 'POST') {
          const form = formidable({
            uploadDir: path.resolve(__dirname, 'public/images'),
            keepExtensions: true,
            maxFileSize: 5 * 1024 * 1024,
            filename: (_name, ext) => {
               return `image_${Date.now()}${ext}`;
            }
          });

          form.parse(req, (err, _fields, files) => {
            if (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: String(err) }));
              return;
            }
            
            const fileArray = Array.isArray(files.image) ? files.image : [files.image];
            const file = fileArray[0];
            
            if (!file) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'No image uploaded' }));
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              success: true, 
              url: `/images/${path.basename(file.filepath)}` 
            }));
          });
          return;
        }
        
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), apiPlugin()],
})
