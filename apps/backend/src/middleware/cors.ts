import { Request, Response, NextFunction } from 'express';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.FRONTEND;
  if (!allowedOrigins) { res.sendStatus(500); return; }

  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Accept,X-Custom-Header');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === "OPTIONS") {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.sendStatus(200);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins); // restrict to frontend domain if not preflight
  }

  next();
}