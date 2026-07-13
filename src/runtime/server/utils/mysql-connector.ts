import type { Pool, PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

interface ConnectorOptions extends PoolOptions {
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}

interface RawStatement {
  all(...args: unknown[]): Promise<unknown[]>
  run(...args: unknown[]): Promise<{ success: boolean }>
  get(...args: unknown[]): Promise<unknown>
}

class BoundableStatement {
  _statement: RawStatement | null

  constructor(rawStmt: RawStatement | null) {
    this._statement = rawStmt
  }

  bind(...params: unknown[]) {
    return new BoundStatement(this, params)
  }
}

class BoundStatement {
  #statement: BoundableStatement
  #params: unknown[]

  constructor(statement: BoundableStatement, params: unknown[]) {
    this.#statement = statement
    this.#params = params
  }

  bind(...params: unknown[]) {
    return new BoundStatement(this.#statement, params)
  }

  all() {
    return this.#statement._statement!.all(...this.#params)
  }

  run() {
    return this.#statement._statement!.run(...this.#params)
  }

  get() {
    return this.#statement._statement!.get(...this.#params)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFn = (sql: string, params?: unknown[]) => Promise<any>

class StatementWrapper extends BoundableStatement {
  #query: QueryFn
  #sql: string

  constructor(sql: string, query: QueryFn) {
    super(null)
    this.#sql = sql
    this.#query = query
  }

  async all(...params: unknown[]) {
    return await this.#query(this.#sql, params)
  }

  async run(...params: unknown[]) {
    const res = await this.#query(this.#sql, params)
    return { success: true, ...res }
  }

  async get(...params: unknown[]) {
    const res = await this.#query(this.#sql, params)
    return res[0]
  }
}

export default function mysqlPoolConnector(opts: ConnectorOptions) {
  let _pool: Pool | null = null

  const getPool = async (): Promise<Pool> => {
    if (_pool) return _pool

    const { createPool } = await import('mysql2/promise')

    _pool = createPool({
      ...opts,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      maxIdle: 5,
      idleTimeout: 60000,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })

    return _pool
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = async (sql: string, params?: unknown[]): Promise<any> => {
    const pool = await getPool()
    const [rows] = await pool.query<RowDataPacket[] | ResultSetHeader>(sql, params)
    return rows
  }

  return {
    name: 'mysql',
    dialect: 'mysql' as const,
    getInstance: getPool,
    exec: (sql: string) => query(sql),
    prepare: (sql: string) => new StatementWrapper(sql, query),
    dispose: async () => {
      if (_pool) {
        await _pool.end()
        _pool = null
      }
    },
  }
}
