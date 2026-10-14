import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Search,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  FileCode,
  Clock,
  Terminal,
  Key,
  ExternalLink,
  Code2,
  Trash2,
  Settings,
  HelpCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';

interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  nullable?: boolean;
  defaultValue?: string;
}

interface TableDefinition {
  name: string;
  schema: 'public' | 'auth' | 'storage';
  description?: string;
  rlsEnabled?: boolean;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
}

interface QueryTab {
  id: string;
  title: string;
  sql: string;
}

interface HistoryItem {
  id: string;
  sql: string;
  timestamp: string;
  durationMs: number;
  rowCount: number;
  status: 'success' | 'error';
  errorMsg?: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  affectedRows?: number;
  message?: string;
}

const DEFAULT_TABLES: Record<string, TableDefinition> = {
  'public.profiles': {
    name: 'profiles',
    schema: 'public',
    description: 'User profile details linked to auth.users',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, nullable: false },
      { name: 'username', type: 'text', nullable: false },
      { name: 'full_name', type: 'text', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      { name: 'role', type: 'text', defaultValue: "'user'" },
      { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
    ],
    rows: [
      { id: '8a5c3e10-951b-4ef9-8134-2908f9c10011', username: 'alex_dev', full_name: 'Alex Rivera', avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', role: 'admin', created_at: '2026-10-10T12:00:00Z' },
      { id: '4b6f1201-382a-44d5-9128-4402a7b20022', username: 'sowjith_a', full_name: 'Sowjith Anumola', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'owner', created_at: '2026-10-11T09:30:00Z' },
      { id: '7c8d9e23-671c-43a1-b849-5511c9d30033', username: 'elena_ro', full_name: 'Elena Rostova', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', role: 'member', created_at: '2026-10-12T14:15:00Z' },
      { id: '9d1a2b34-890d-45e2-a765-6622d0e40044', username: 'marcus_k', full_name: 'Marcus Vance', avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', role: 'member', created_at: '2026-10-13T16:45:00Z' },
    ],
  },
  'public.todos': {
    name: 'todos',
    schema: 'public',
    description: 'User task items with Row Level Security',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, nullable: false },
      { name: 'user_id', type: 'uuid', isForeign: true, nullable: false },
      { name: 'task', type: 'text', nullable: false },
      { name: 'is_complete', type: 'boolean', defaultValue: 'false' },
      { name: 'priority', type: 'text', defaultValue: "'normal'" },
      { name: 'inserted_at', type: 'timestamptz', defaultValue: 'now()' },
    ],
    rows: [
      { id: '11111111-0000-0000-0000-000000000001', user_id: '4b6f1201-382a-44d5-9128-4402a7b20022', task: 'Implement Supabase SQL Studio UI', is_complete: true, priority: 'high', inserted_at: '2026-10-14T06:00:00Z' },
      { id: '11111111-0000-0000-0000-000000000002', user_id: '4b6f1201-382a-44d5-9128-4402a7b20022', task: 'Audit RLS security policies for tables', is_complete: true, priority: 'high', inserted_at: '2026-10-14T06:15:00Z' },
      { id: '11111111-0000-0000-0000-000000000003', user_id: '8a5c3e10-951b-4ef9-8134-2908f9c10011', task: 'Configure real-time change data capture', is_complete: false, priority: 'medium', inserted_at: '2026-10-14T06:30:00Z' },
      { id: '11111111-0000-0000-0000-000000000004', user_id: '7c8d9e23-671c-43a1-b849-5511c9d30033', task: 'Benchmark JSONB indexing performance', is_complete: false, priority: 'low', inserted_at: '2026-10-14T06:45:00Z' },
    ],
  },
  'public.documents': {
    name: 'documents',
    schema: 'public',
    description: 'Shared markdown and code documents',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, nullable: false },
      { name: 'title', type: 'text', nullable: false },
      { name: 'author_id', type: 'uuid', isForeign: true, nullable: false },
      { name: 'category', type: 'text', defaultValue: "'general'" },
      { name: 'views', type: 'int4', defaultValue: '0' },
      { name: 'updated_at', type: 'timestamptz', defaultValue: 'now()' },
    ],
    rows: [
      { id: '22222222-0000-0000-0000-000000000001', title: 'System Architecture v2', author_id: '4b6f1201-382a-44d5-9128-4402a7b20022', category: 'engineering', views: 142, updated_at: '2026-10-14T05:00:00Z' },
      { id: '22222222-0000-0000-0000-000000000002', title: 'Supabase RLS Best Practices', author_id: '8a5c3e10-951b-4ef9-8134-2908f9c10011', category: 'security', views: 89, updated_at: '2026-10-14T05:30:00Z' },
      { id: '22222222-0000-0000-0000-000000000003', title: 'WebOS Windowing Spec', author_id: '7c8d9e23-671c-43a1-b849-5511c9d30033', category: 'design', views: 64, updated_at: '2026-10-14T06:10:00Z' },
    ],
  },
  'auth.users': {
    name: 'users',
    schema: 'auth',
    description: 'Supabase internal authentication user accounts',
    rlsEnabled: true,
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, nullable: false },
      { name: 'email', type: 'text', nullable: false },
      { name: 'last_sign_in_at', type: 'timestamptz', nullable: true },
      { name: 'confirmed_at', type: 'timestamptz', nullable: true },
      { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
    ],
    rows: [
      { id: '4b6f1201-382a-44d5-9128-4402a7b20022', email: 'sowjith@webos.internal', last_sign_in_at: '2026-10-14T06:50:00Z', confirmed_at: '2026-10-11T09:30:00Z', created_at: '2026-10-11T09:30:00Z' },
      { id: '8a5c3e10-951b-4ef9-8134-2908f9c10011', email: 'alex@company.com', last_sign_in_at: '2026-10-14T04:20:00Z', confirmed_at: '2026-10-10T12:00:00Z', created_at: '2026-10-10T12:00:00Z' },
      { id: '7c8d9e23-671c-43a1-b849-5511c9d30033', email: 'elena@studio.io', last_sign_in_at: '2026-10-13T19:10:00Z', confirmed_at: '2026-10-12T14:15:00Z', created_at: '2026-10-12T14:15:00Z' },
    ],
  },
};

const SQL_TEMPLATES = [
  {
    title: 'User Profiles with RLS & Foreign Key',
    desc: 'Creates a public.profiles table linked to auth.users with public read and owner update policies.',
    sql: `-- 1. Create a table for public profiles linked to auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- 2. Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create security policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( (select auth.uid()) = id );`,
  },
  {
    title: 'Row Level Security (RLS) Template',
    desc: 'Standard RLS policy suite ensuring users only access their own records.',
    sql: `-- Enable RLS on your target table
alter table public.todos enable row level security;

-- Policy: Allow users to view only their own records
create policy "Users can read own todos"
  on public.todos for select
  using ( (select auth.uid()) = user_id );

-- Policy: Allow users to insert their own records
create policy "Users can create their own todos"
  on public.todos for insert
  with check ( (select auth.uid()) = user_id );

-- Policy: Allow users to update only their own records
create policy "Users can update their own todos"
  on public.todos for update
  using ( (select auth.uid()) = user_id );`,
  },
  {
    title: 'Automatic Updated_At Timestamp Trigger',
    desc: 'Trigger function that updates updated_at whenever a row is modified.',
    sql: `-- Create helper function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach trigger to public.profiles
create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();`,
  },
  {
    title: 'Full-Text Search Vector & Index',
    desc: 'Adds a generated tsvector column with GIN indexing for fast text search.',
    sql: `-- Add generated search vector column
alter table public.documents
  add column search_vector tsvector
  generated always as (to_tsvector('english', title || ' ' || coalesce(category, ''))) stored;

-- Create GIN index for rapid full-text lookup
create index idx_documents_search on public.documents using gin (search_vector);

-- Example search query
select id, title, category
from public.documents
where search_vector @@ to_tsquery('english', 'architecture | security');`,
  },
  {
    title: 'Database Function (RPC) with SECURITY DEFINER',
    desc: 'Defines a Postgres stored procedure callable from client RPC.',
    sql: `-- Define secure function to count active tasks for current user
create or replace function get_my_task_summary()
returns table (
  total_count bigint,
  completed_count bigint,
  pending_count bigint
) language plpgsql security definer as $$
begin
  return query
  select
    count(*)::bigint as total_count,
    count(*) filter (where is_complete = true)::bigint as completed_count,
    count(*) filter (where is_complete = false)::bigint as pending_count
  from public.todos
  where user_id = auth.uid();
end;
$$;`,
  },
  {
    title: 'Storage Bucket Security Policy',
    desc: 'Creates a storage bucket and configures RLS for authenticated uploads.',
    sql: `-- Insert bucket if not exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public read access to avatar images
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow users to upload their own avatar
create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );`,
  },
];

export const SupabaseSQLEditorApp: React.FC = () => {
  const { addNotification } = useOS();

  // Storage key
  const STORAGE_KEY = 'webos_supabase_sql_state_v1';
  const TABLES_KEY = 'webos_supabase_tables_v1';

  // State: Tables
  const [tables, setTables] = useState<Record<string, TableDefinition>>(() => {
    try {
      const saved = localStorage.getItem(TABLES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // transient
    }
    return DEFAULT_TABLES;
  });

  // State: Query Tabs
  const [queryTabs, setQueryTabs] = useState<QueryTab[]>([
    {
      id: 'tab_1',
      title: 'profiles_query.sql',
      sql: `-- Select all profiles with administrative roles
SELECT id, username, full_name, role, created_at
FROM public.profiles
ORDER BY created_at DESC;`,
    },
    {
      id: 'tab_2',
      title: 'todos_status.sql',
      sql: `-- Inspect pending todos grouped by priority
SELECT id, task, is_complete, priority, inserted_at
FROM public.todos
WHERE is_complete = false
ORDER BY priority DESC;`,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // Query History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Results & Execution state
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [result, setResult] = useState<QueryResult | null>({
    columns: ['id', 'username', 'full_name', 'role', 'created_at'],
    rows: DEFAULT_TABLES['public.profiles'].rows,
    rowCount: DEFAULT_TABLES['public.profiles'].rows.length,
    executionTimeMs: 14,
    message: 'Success. Returned 4 rows in 14ms.',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active view tab in results
  const [resultView, setResultView] = useState<'grid' | 'json' | 'history' | 'explain'>('grid');

  // UI state
  const [sidebarTab, setSidebarTab] = useState<'tables' | 'templates'>('tables');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({ 'public.profiles': true });
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Connection settings
  const [connectionMode, setConnectionMode] = useState<'sandbox' | 'live'>('sandbox');
  const [supabaseUrl, setSupabaseUrl] = useState<string>('https://xyzcompany.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState<string>('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox');

  // Editor cursor pos
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeTab = useMemo(() => {
    return queryTabs.find((t) => t.id === activeTabId) || queryTabs[0];
  }, [queryTabs, activeTabId]);

  // Save tables to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    } catch {
      // transient
    }
  }, [tables]);

  const updateCursorPosition = (el: HTMLTextAreaElement) => {
    const text = el.value.substring(0, el.selectionStart);
    const lines = text.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleSqlChange = (val: string) => {
    setQueryTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, sql: val } : t))
    );
  };

  // Format SQL keywords
  const formatSQL = () => {
    if (!activeTab) return;
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
      'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
      'ALTER TABLE', 'ENABLE ROW LEVEL SECURITY', 'CREATE POLICY', 'USING',
      'WITH CHECK', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'LIMIT', 'OFFSET',
      'ASC', 'DESC', 'NULL', 'NOT NULL', 'PRIMARY KEY', 'REFERENCES', 'CHECK',
      'AS', 'IN', 'IS', 'LIKE', 'ILIKE', 'BEGIN', 'END', 'RETURN', 'TRIGGER',
    ];

    let formatted = activeTab.sql;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });

    handleSqlChange(formatted);
    addNotification('SQL Formatted', 'Standardized SQL keyword capitalization.', 'info');
  };

  // Safe local Postgres Query Evaluator
  const executeQuery = () => {
    if (!activeTab || !activeTab.sql.trim()) return;
    setIsExecuting(true);
    setErrorMsg(null);

    const startTime = performance.now();
    const rawSql = activeTab.sql.trim();

    setTimeout(() => {
      try {
        // Strip comments
        const cleanSql = rawSql
          .replace(/--.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .trim();

        if (!cleanSql) {
          throw new Error('Query string is empty or contains only comments.');
        }

        const upper = cleanSql.toUpperCase();

        // 1. Handle SELECT
        if (upper.startsWith('SELECT')) {
          const fromMatch = cleanSql.match(/FROM\s+([a-zA-Z0-9_\.]+)/i);
          if (!fromMatch) {
            // SELECT 1+1 or expressions
            const duration = Math.round(performance.now() - startTime);
            setResult({
              columns: ['?column?'],
              rows: [{ '?column?': 'PostgreSQL 15.4 (WebOS SQL Engine)' }],
              rowCount: 1,
              executionTimeMs: Math.max(1, duration),
              message: 'Query executed successfully.',
            });
            recordHistory(rawSql, 'success', 1, duration);
            setIsExecuting(false);
            return;
          }

          let tableName = fromMatch[1];
          if (!tableName.includes('.')) {
            tableName = `public.${tableName}`;
          }

          const targetTable = tables[tableName];
          if (!targetTable) {
            throw new Error(`relation "${tableName}" does not exist. Verify schema or table name.`);
          }

          let matchedRows = [...targetTable.rows];

          // Simple WHERE filter parser (e.g. WHERE is_complete = false or WHERE role = 'admin')
          const whereMatch = cleanSql.match(/WHERE\s+([a-zA-Z0-9_]+)\s*(=|!=|>|<|LIKE)\s*([^\s;]+)/i);
          if (whereMatch) {
            const col = whereMatch[1];
            const op = whereMatch[2];
            let valStr = whereMatch[3].replace(/^['"]|['"]$/g, '');

            matchedRows = matchedRows.filter((r) => {
              const cellVal = r[col];
              if (cellVal === undefined) return true;
              if (op === '=') {
                if (typeof cellVal === 'boolean') return String(cellVal) === valStr.toLowerCase();
                return String(cellVal).toLowerCase() === valStr.toLowerCase();
              }
              if (op === '!=') return String(cellVal) !== valStr;
              return true;
            });
          }

          // ORDER BY
          if (upper.includes('ORDER BY')) {
            const orderMatch = cleanSql.match(/ORDER BY\s+([a-zA-Z0-9_]+)\s*(ASC|DESC)?/i);
            if (orderMatch) {
              const col = orderMatch[1];
              const desc = orderMatch[2]?.toUpperCase() === 'DESC';
              matchedRows.sort((a, b) => {
                const va = a[col];
                const vb = b[col];
                if (va === vb) return 0;
                if (va === null || va === undefined) return 1;
                if (vb === null || vb === undefined) return -1;
                return desc ? (va < vb ? 1 : -1) : (va > vb ? 1 : -1);
              });
            }
          }

          // Column projection
          const selectMatch = cleanSql.match(/SELECT\s+(.+?)\s+FROM/i);
          let cols = targetTable.columns.map((c) => c.name);
          if (selectMatch && selectMatch[1].trim() !== '*') {
            cols = selectMatch[1].split(',').map((c) => c.trim().split(/\s+as\s+/i)[0].trim());
          }

          const duration = Math.round(performance.now() - startTime);
          setResult({
            columns: cols,
            rows: matchedRows,
            rowCount: matchedRows.length,
            executionTimeMs: Math.max(1, duration),
            message: `Success. Returned ${matchedRows.length} rows in ${Math.max(1, duration)}ms.`,
          });
          recordHistory(rawSql, 'success', matchedRows.length, duration);
        }
        // 2. Handle CREATE TABLE
        else if (upper.startsWith('CREATE TABLE')) {
          const tableMatch = cleanSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)/i);
          if (!tableMatch) throw new Error('Syntax error in CREATE TABLE statement.');

          let tblName = tableMatch[1];
          if (!tblName.includes('.')) tblName = `public.${tblName}`;

          const simpleName = tblName.split('.')[1];
          const newTbl: TableDefinition = {
            name: simpleName,
            schema: 'public',
            description: 'User-created table in public schema',
            rlsEnabled: false,
            columns: [
              { name: 'id', type: 'uuid', isPrimary: true, nullable: false },
              { name: 'created_at', type: 'timestamptz', defaultValue: 'now()' },
              { name: 'data', type: 'jsonb' },
            ],
            rows: [],
          };

          setTables((prev) => ({ ...prev, [tblName]: newTbl }));
          const duration = Math.round(performance.now() - startTime);
          setResult({
            columns: ['status'],
            rows: [{ status: `Table "${tblName}" created successfully.` }],
            rowCount: 0,
            executionTimeMs: Math.max(1, duration),
            message: `CREATE TABLE executed successfully in ${Math.max(1, duration)}ms.`,
          });
          recordHistory(rawSql, 'success', 0, duration);
          addNotification('Table Created', `Created table "${tblName}".`, 'success');
        }
        // 3. Handle INSERT INTO
        else if (upper.startsWith('INSERT INTO')) {
          const insertMatch = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_\.]+)/i);
          let tblName = insertMatch ? insertMatch[1] : 'public.profiles';
          if (!tblName.includes('.')) tblName = `public.${tblName}`;

          const duration = Math.round(performance.now() - startTime);
          setResult({
            columns: ['status', 'rows_affected'],
            rows: [{ status: 'INSERT 0 1', rows_affected: 1 }],
            rowCount: 1,
            executionTimeMs: Math.max(1, duration),
            message: `INSERT 0 1 completed in ${Math.max(1, duration)}ms.`,
          });
          recordHistory(rawSql, 'success', 1, duration);
          addNotification('Inserted', 'Row inserted successfully.', 'success');
        }
        // 4. Handle ALTER TABLE / POLICY
        else if (upper.startsWith('ALTER TABLE') || upper.startsWith('CREATE POLICY')) {
          const duration = Math.round(performance.now() - startTime);
          setResult({
            columns: ['result'],
            rows: [{ result: 'Row Level Security policy compiled and enforced.' }],
            rowCount: 0,
            executionTimeMs: Math.max(1, duration),
            message: `Command completed in ${Math.max(1, duration)}ms.`,
          });
          recordHistory(rawSql, 'success', 0, duration);
          addNotification('Policy Applied', 'Row Level Security policy configured.', 'success');
        } else {
          // General DDL/DML fallback
          const duration = Math.round(performance.now() - startTime);
          setResult({
            columns: ['result'],
            rows: [{ result: 'Command completed successfully.' }],
            rowCount: 0,
            executionTimeMs: Math.max(1, duration),
            message: `Statement executed in ${Math.max(1, duration)}ms.`,
          });
          recordHistory(rawSql, 'success', 0, duration);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err);
        const duration = Math.round(performance.now() - startTime);
        setErrorMsg(error);
        setResult(null);
        recordHistory(rawSql, 'error', 0, duration, error);
      } finally {
        setIsExecuting(false);
      }
    }, 250);
  };

  const recordHistory = (
    sql: string,
    status: 'success' | 'error',
    rowCount: number,
    durationMs: number,
    errorMsg?: string
  ) => {
    const item: HistoryItem = {
      id: `hist_${Date.now()}`,
      sql,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      durationMs,
      rowCount,
      status,
      errorMsg,
    };
    setHistory((prev) => [item, ...prev.slice(0, 24)]);
  };

  // Keyboard shortcut Ctrl+Enter to Run Query
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeQuery();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Export Results
  const exportCsv = () => {
    if (!result || result.rows.length === 0) return;
    const headers = result.columns.join(',');
    const rows = result.rows.map((r) =>
      result.columns.map((col) => JSON.stringify(r[col] ?? '')).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase_query_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('CSV Exported', 'Query results saved as CSV file.', 'success');
  };

  const exportJson = () => {
    if (!result || result.rows.length === 0) return;
    const jsonStr = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase_query_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('JSON Exported', 'Query results saved as JSON file.', 'success');
  };

  // Insert Table SELECT statement
  const insertSelectForTable = (tableName: string) => {
    const target = tables[tableName];
    if (!target) return;
    const colList = target.columns.map((c) => c.name).join(', ');
    const query = `-- Query table: ${tableName}\nSELECT ${colList}\nFROM ${tableName}\nLIMIT 25;`;
    handleSqlChange(query);
  };

  // Create new Query Tab
  const createNewTab = (initialSql: string = 'SELECT * FROM public.profiles LIMIT 25;') => {
    const newId = `tab_${Date.now()}`;
    const newTab: QueryTab = {
      id: newId,
      title: `query_${queryTabs.length + 1}.sql`,
      sql: initialSql,
    };
    setQueryTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (queryTabs.length === 1) return;
    const nextTabs = queryTabs.filter((t) => t.id !== id);
    setQueryTabs(nextTabs);
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none text-xs font-sans">
      {/* 1. Supabase Main Top Navigation */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          {/* Brand Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 font-semibold border border-emerald-500/30">
            <Database size={13} className="text-emerald-400" />
            <span>SQL Studio</span>
          </div>

          {/* Connection Status Pill */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors border border-slate-700/60"
            title="Configure Cloud & Local Database Connection"
          >
            <span className={`w-2 h-2 rounded-full ${connectionMode === 'sandbox' ? 'bg-emerald-400' : 'bg-cyan-400'} animate-pulse`} />
            <span className="font-medium">
              {connectionMode === 'sandbox' ? 'Local Cloud (Sandbox)' : 'Cloud Login (Connected)'}
            </span>
            <Settings size={11} className="text-slate-400 ml-1" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={formatSQL}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Format SQL (Standardize keywords)"
          >
            <Sparkles size={12} className="text-amber-400" />
            <span>Format</span>
          </button>

          <button
            onClick={executeQuery}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition-colors shadow-sm shadow-emerald-950"
            title="Execute Query (Ctrl+Enter)"
          >
            <Play size={12} className="fill-white" />
            <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
            <span className="text-[10px] text-emerald-200 font-mono hidden sm:inline ml-1">⌘↵</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Export Dropdown */}
          <button
            onClick={exportCsv}
            disabled={!result || result.rows.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Export results as CSV"
          >
            <Download size={12} className="text-cyan-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={exportJson}
            disabled={!result || result.rows.length === 0}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Export results as JSON"
          >
            <Download size={12} className="text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout (Sidebar + Editor + Results) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Explorer: Schema / Tables & SQL Templates */}
        <div className="w-60 border-r border-slate-800 bg-slate-950/70 flex flex-col justify-between">
          <div>
            {/* Sidebar Tab Header */}
            <div className="flex items-center border-b border-slate-800 bg-slate-900/60 p-1">
              <button
                onClick={() => setSidebarTab('tables')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${
                  sidebarTab === 'tables' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Database Schema
              </button>
              <button
                onClick={() => setSidebarTab('templates')}
                className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${
                  sidebarTab === 'templates' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SQL Templates
              </button>
            </div>

            {/* Sidebar Content */}
            {sidebarTab === 'tables' ? (
              <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
                  Schemas & Tables ({Object.keys(tables).length})
                </div>

                {Object.entries(tables).map(([fullKey, tbl]) => {
                  const isExpanded = !!expandedTables[fullKey];
                  return (
                    <div key={fullKey} className="rounded-lg border border-slate-800/60 bg-slate-900/30 overflow-hidden">
                      <div
                        onClick={() =>
                          setExpandedTables((prev) => ({ ...prev, [fullKey]: !prev[fullKey] }))
                        }
                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-900/80 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                          <TableIcon size={13} className="text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-200 text-xs truncate">{fullKey}</span>
                        </div>
                        {tbl.rlsEnabled && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40" title="Row Level Security active">
                            RLS
                          </span>
                        )}
                      </div>

                      {/* Columns Sublist */}
                      {isExpanded && (
                        <div className="px-3 pb-2 pt-1 border-t border-slate-800/50 bg-slate-950/40 space-y-1 text-[11px]">
                          <div className="flex justify-end pb-1">
                            <button
                              onClick={() => insertSelectForTable(fullKey)}
                              className="text-[10px] text-emerald-400 hover:underline"
                            >
                              Insert SELECT query
                            </button>
                          </div>
                          {tbl.columns.map((col) => (
                            <div key={col.name} className="flex items-center justify-between text-slate-400 font-mono">
                              <span className="truncate flex items-center gap-1">
                                {col.isPrimary && <span className="text-amber-400 font-bold" title="Primary Key">PK</span>}
                                {col.isForeign && <span className="text-cyan-400 font-bold" title="Foreign Key">FK</span>}
                                <span>{col.name}</span>
                              </span>
                              <span className="text-slate-600 text-[10px]">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SQL Templates List */
              <div className="p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">
                  Best-Practice Snippets
                </div>
                {SQL_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.title}
                    onClick={() => createNewTab(tmpl.sql)}
                    className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-emerald-500/40 hover:bg-slate-900 cursor-pointer transition-all text-left group"
                  >
                    <div className="font-semibold text-slate-200 text-xs group-hover:text-emerald-400 transition-colors mb-1">
                      {tmpl.title}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {tmpl.desc}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2.5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>RLS Enforced</span>
            </span>
            <span>pg_catalog v15</span>
          </div>
        </div>

        {/* Center & Right: Query Tabs + SQL Editor + Results Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Query Tabs Bar */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 pt-1 gap-1 overflow-x-auto">
            {queryTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer text-xs max-w-[200px] truncate transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 font-medium border-t-2 border-t-emerald-500 border-x border-slate-800'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <FileCode size={12} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                  <span className="truncate flex-1 font-mono">{tab.title}</span>
                  {queryTabs.length > 1 && (
                    <button
                      onClick={(e) => closeTab(tab.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => createNewTab()}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="New Query Tab"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* SQL Editor Area with Line Numbers */}
          <div className="h-64 flex border-b border-slate-800 bg-slate-900/60 font-mono overflow-hidden">
            {/* Line Numbers */}
            <div className="w-10 py-3 bg-slate-950/70 border-r border-slate-800/80 text-right pr-2 text-slate-600 select-none text-xs leading-5">
              {(activeTab?.sql || '').split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editor Textarea */}
            <textarea
              ref={textareaRef}
              value={activeTab?.sql || ''}
              onChange={(e) => handleSqlChange(e.target.value)}
              onSelect={(e) => updateCursorPosition(e.currentTarget)}
              onClick={(e) => updateCursorPosition(e.currentTarget)}
              onKeyUp={(e) => updateCursorPosition(e.currentTarget)}
              placeholder="-- Write PostgreSQL query or execute templates..."
              spellCheck={false}
              className="flex-1 bg-transparent text-slate-100 p-3 leading-5 font-mono text-xs focus:outline-none resize-none select-text caret-emerald-400"
            />
          </div>

          {/* Query Status Strip */}
          <div className="flex items-center justify-between px-3 py-1 border-b border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="text-emerald-400">PostgreSQL</span>
              <span>UTF-8</span>
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Shortcut: Ctrl + Enter to execute</span>
            </div>
          </div>

          {/* 3. Results Panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            {/* Results Navigation Tabs & Status */}
            <div className="flex items-center justify-between px-3 py-1 border-b border-slate-800 bg-slate-900/70 text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setResultView('grid')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    resultView === 'grid' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Table Grid ({result?.rowCount ?? 0})
                </button>
                <button
                  onClick={() => setResultView('json')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    resultView === 'json' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Payload
                </button>
                <button
                  onClick={() => setResultView('history')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    resultView === 'history' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  History ({history.length})
                </button>
                <button
                  onClick={() => setResultView('explain')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    resultView === 'explain' ? 'bg-slate-800 text-emerald-400 font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Query Plan
                </button>
              </div>

              {/* Execution Status Message */}
              <div className="text-[11px] font-mono">
                {errorMsg ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle size={12} /> Error
                  </span>
                ) : result ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {result.message}
                  </span>
                ) : (
                  <span className="text-slate-500">Ready</span>
                )}
              </div>
            </div>

            {/* Results Body */}
            <div className="flex-1 overflow-auto">
              {errorMsg ? (
                /* Error Banner */
                <div className="p-4 bg-rose-950/20 border-l-4 border-rose-500 m-3 rounded text-rose-300 font-mono text-xs">
                  <div className="font-bold mb-1 flex items-center gap-1.5">
                    <AlertCircle size={14} /> PostgreSQL Execution Error
                  </div>
                  <div>{errorMsg}</div>
                </div>
              ) : resultView === 'grid' ? (
                /* Interactive Data Grid */
                result && result.columns.length > 0 ? (
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-slate-800 font-mono text-xs text-left">
                      <thead className="bg-slate-900 sticky top-0 z-10 text-slate-300">
                        <tr>
                          <th className="px-3 py-2 text-slate-500 w-10 text-right">#</th>
                          {result.columns.map((col) => (
                            <th key={col} className="px-3 py-2 font-semibold tracking-wider uppercase text-[10px] text-slate-400 border-r border-slate-800/60">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                        {result.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-900/60 transition-colors">
                            <td className="px-3 py-1.5 text-slate-600 text-right select-none">{rowIdx + 1}</td>
                            {result.columns.map((col) => {
                              const val = row[col];
                              return (
                                <td key={col} className="px-3 py-1.5 text-slate-200 border-r border-slate-800/40 truncate max-w-xs select-text">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-600 italic">null</span>
                                  ) : typeof val === 'boolean' ? (
                                    <span className={val ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                                      {String(val)}
                                    </span>
                                  ) : typeof val === 'object' ? (
                                    <span className="text-amber-300">{JSON.stringify(val)}</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No results to display. Press "Run Query" or Ctrl+Enter to execute.
                  </div>
                )
              ) : resultView === 'json' ? (
                /* JSON Raw Output */
                <div className="p-3">
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto select-text">
                    {JSON.stringify(result?.rows || [], null, 2)}
                  </pre>
                </div>
              ) : resultView === 'history' ? (
                /* Query Execution History */
                <div className="p-3 space-y-2">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">No queries executed in this session yet.</div>
                  ) : (
                    history.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleSqlChange(h.sql)}
                        className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-semibold ${h.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {h.status.toUpperCase()} ({h.durationMs}ms)
                          </span>
                          <span className="text-slate-500">{h.timestamp}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-300 truncate">{h.sql}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Query Explain Plan */
                <div className="p-4 space-y-3 font-mono text-xs">
                  <div className="text-slate-400 font-semibold">Simulated Query Execution Plan</div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
                    <div className="text-emerald-400">{'->'} Seq Scan on target relation (cost=0.00..12.50 rows=100 width=72)</div>
                    <div className="text-slate-400 ml-4">Filter: Row Level Security active (security definer)</div>
                    <div className="text-cyan-400 ml-4">Planning Time: 0.082 ms</div>
                    <div className="text-cyan-400 ml-4">Execution Time: {result?.executionTimeMs ?? 14} ms</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Connection & Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-[480px] p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-sm text-slate-100">Database Connection & Cloud Setup</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Database Environment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConnectionMode('sandbox')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      connectionMode === 'sandbox'
                        ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Local Cloud (Sandbox)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Fast in-browser Postgres engine</div>
                  </button>
                  <button
                    onClick={() => setConnectionMode('live')}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      connectionMode === 'live'
                        ? 'border-emerald-500 bg-emerald-600/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <div className="font-semibold">Remote Cloud Login</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Live PostgreSQL endpoint & key</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Cloud Endpoint / Database Host URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://db.yourproject.com or postgresql://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs select-text"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">API Key / Bearer Auth Token / Password</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="Enter secret token or service key..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-xs select-text"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  addNotification('Connection Updated', `Active mode: ${connectionMode === 'sandbox' ? 'Local Cloud Sandbox' : 'Remote Cloud'}.`, 'success');
                }}
                className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { SupabaseSQLEditorApp as SQLEditorApp };
