import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export interface QRPayload {
  userId: string;
  userRole: 'manager' | 'staff' | 'member';
}


export const generateQR = (userId: string, userRole: 'manager' | 'staff' | 'member'): string => {
  return jwt.sign({ userId, userRole }, env.JWT_SECRET);
};


export const verifyQR = (token: string): QRPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as QRPayload;
  return { userId: decoded.userId, userRole: decoded.userRole };
};