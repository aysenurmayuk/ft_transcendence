import { Database } from 'sqlite3';
import * as sqlite from 'sqlite';

const DATABASE_FILE = process.env.DATABASE_PATH || './database.sqlite';

let dbInstance: sqlite.Database | null = null;

export async function createConnection(): Promise<sqlite.Database> {
    if (!dbInstance) {
        dbInstance = await sqlite.open({
            filename: DATABASE_FILE,
            driver: Database
        });
        
        // Initialize database schema
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
    return dbInstance;
}

export async function openDatabase(): Promise<sqlite.Database> {
    return createConnection();
}

export async function closeDatabase(db: sqlite.Database): Promise<void> {
    await db.close();
    dbInstance = null;
}