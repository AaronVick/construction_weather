// Type definitions for node-fetch module
declare module 'node-fetch' {
  import { ReadableStream } from 'stream/web';

  export default function fetch(
    url: string | Request,
    init?: RequestInit
  ): Promise<Response>;
  
  export class Request extends globalThis.Request {
    constructor(input: RequestInfo, init?: RequestInit);
  }
  
  export class Response extends globalThis.Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
    static error(): Response;
    static redirect(url: string, status?: number): Response;
  }
  
  export type RequestInfo = Request | string | URL;
  
  export interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    redirect?: RequestRedirect;
    signal?: AbortSignal | null;
    agent?: any;
    compress?: boolean;
    follow?: number;
    size?: number;
    timeout?: number;
    referrer?: string;
    referrerPolicy?: ReferrerPolicy;
    integrity?: string;
    keepalive?: boolean;
    window?: null;
  }
  
  export type BodyInit = ArrayBuffer | ArrayBufferView | string | URLSearchParams | ReadableStream | FormData | NodeJS.ReadableStream;
  export type RequestRedirect = 'follow' | 'error' | 'manual';
  export type HeadersInit = Headers | string[][] | Record<string, string>;
  
  export interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }
  
  export interface HeadersInterface {
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callback: (value: string, name: string) => void): void;
  }
  
  export class Headers implements HeadersInterface {
    constructor(init?: HeadersInit);
    append(name: string, value: string): void;
    delete(name: string): void;
    get(name: string): string | null;
    has(name: string): boolean;
    set(name: string, value: string): void;
    forEach(callback: (value: string, name: string) => void): void;
  }
}