import { NextFunction, Request, Response } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    console.info(new Date(), req.url, res.statusCode, res.statusMessage);
    if (req.body && process.env.NODE_ENV === 'development')
      console.log(req.body);
  });

  next();
}
