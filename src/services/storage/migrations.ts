import type { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema for records, scan_sessions, candidates, reminders, and settings',
    up: async (db: SQLiteDatabase) => {
      // 1. Schema migrations table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL
        );
      `);

      // 2. Saved records table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS records (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          document_type TEXT NOT NULL,
          provider TEXT,
          reference_number TEXT,
          holder_name TEXT,
          issue_date TEXT,
          start_date TEXT,
          expiry_date TEXT,
          renewal_date TEXT,
          purchase_date TEXT,
          warranty_end_date TEXT,
          vehicle_reg_number TEXT,
          notes TEXT,
          source_type TEXT NOT NULL,
          source_asset_id TEXT,
          attachment_path TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_records_expiry ON records(expiry_date);
        CREATE INDEX IF NOT EXISTS idx_records_renewal ON records(renewal_date);
        CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
        CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
        CREATE INDEX IF NOT EXISTS idx_records_reference ON records(reference_number);
      `);

      // 3. Scan sessions table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS scan_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          scan_mode TEXT NOT NULL,
          status TEXT NOT NULL,
          processed_count INTEGER NOT NULL DEFAULT 0,
          detected_count INTEGER NOT NULL DEFAULT 0,
          permission_scope TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_started ON scan_sessions(started_at DESC);
      `);

      // 4. Temporary scan candidates table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS scan_candidates (
          id TEXT PRIMARY KEY NOT NULL,
          scan_session_id TEXT NOT NULL,
          source_asset_identifier TEXT NOT NULL,
          source_asset_uri TEXT NOT NULL,
          source_asset_hash TEXT,
          category TEXT NOT NULL,
          document_type TEXT NOT NULL,
          title TEXT NOT NULL,
          extracted_fields_json TEXT NOT NULL,
          confidence_json TEXT NOT NULL,
          candidate_dates_json TEXT,
          review_status TEXT NOT NULL DEFAULT 'pending',
          duplicate_of_record_id TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(scan_session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_candidates_session ON scan_candidates(scan_session_id);
        CREATE INDEX IF NOT EXISTS idx_candidates_status ON scan_candidates(review_status);
        CREATE INDEX IF NOT EXISTS idx_candidates_hash ON scan_candidates(source_asset_hash);
      `);

      // 5. Reminder rules table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reminder_rules (
          id TEXT PRIMARY KEY NOT NULL,
          record_id TEXT NOT NULL,
          offset_days INTEGER NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          notification_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_reminders_record ON reminder_rules(record_id);
      `);

      // 6. Attachments table (for user-approved optional image copies)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS attachments (
          id TEXT PRIMARY KEY NOT NULL,
          record_id TEXT NOT NULL,
          local_path TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          created_at TEXT NOT NULL,
          FOREIGN KEY(record_id) REFERENCES records(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_attachments_record ON attachments(record_id);
      `);

      // 7. App settings table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Ensure schema_migrations exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version ASC');
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[Storage] Applying migration v${migration.version}: ${migration.description}`);
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        migration.version,
        new Date().toISOString()
      );
    }
  }
}
