
import { request } from '@playwright/test';

export async function api() {
  return await request.newContext({
    baseURL: process.env.API_BASE_URL
  });
}
