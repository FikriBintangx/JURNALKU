import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: boolean;
}

export const createSafeResponse = (data: any, message?: string, status: number = 200) => {
  return NextResponse.json({
    success: true,
    error: false,
    data,
    message
  }, { status });
};

export const createErrorResponse = (message: string, status: number = 200) => {
  return NextResponse.json({
    success: false,
    error: true,
    message,
    data: null
  }, { status });
};
