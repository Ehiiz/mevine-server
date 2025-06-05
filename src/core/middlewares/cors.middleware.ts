import * as cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import { pathToRegexp } from 'path-to-regexp';

const whiteList = [
  'http://localhost:3000',
  'https://nabteb-frontend.vercel.app',
  'https://nabteb-admin.vercel.app',
];

const corsSelector = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export function corsOptions(req: Request, res: Response, next: NextFunction) {
  const permittedPaths = ['/health', '/webhook/cloudinary'];

  const isCorsByPassed = permittedPaths.some((path) =>
    pathToRegexp(path).regexp.test(req.path),
  );
  if (!isCorsByPassed) {
    cors(corsSelector)(req, res, next);
  } else {
    next();
  }
}
