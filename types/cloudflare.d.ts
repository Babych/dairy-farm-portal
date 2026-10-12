// Cloudflare D1 Database & Worker Environment Types

export interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<{ success: boolean; meta: any; results?: T[] }>;
    all<T = unknown>(): Promise<{ success: boolean; meta: any; results: T[] }>;
    raw<T = unknown>(): Promise<T[][]>;
}

export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<Array<{ success: boolean; meta: any; results?: T[] }>>;
    exec(query: string): Promise<{ count: number; duration: number }>;
}

export interface WorkerEnv {
    DB: D1Database;
    PARSER_SECRET_TOKEN?: string;
    UNIFORM_PARSER_URL?: string;
    [key: string]: any;
}
