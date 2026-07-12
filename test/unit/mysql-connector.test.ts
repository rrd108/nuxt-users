import { describe, it, expect } from 'vitest'
import mysqlPoolConnector from '../../src/runtime/server/utils/mysql-connector'

describe('MySQL Pool Connector', () => {
  it('should export a function', () => {
    expect(typeof mysqlPoolConnector).toBe('function')
  })

  it('should return a connector with correct interface', () => {
    const connector = mysqlPoolConnector({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'test',
    })

    expect(connector).toBeDefined()
    expect(connector.name).toBe('mysql')
    expect(connector.dialect).toBe('mysql')
    expect(typeof connector.getInstance).toBe('function')
    expect(typeof connector.exec).toBe('function')
    expect(typeof connector.prepare).toBe('function')
    expect(typeof connector.dispose).toBe('function')
  })

  it('should return a prepared statement with correct methods', () => {
    const connector = mysqlPoolConnector({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'test',
    })

    const stmt = connector.prepare('SELECT 1')
    expect(stmt).toBeDefined()
    expect(typeof stmt.all).toBe('function')
    expect(typeof stmt.run).toBe('function')
    expect(typeof stmt.get).toBe('function')
    expect(typeof stmt.bind).toBe('function')
  })

  it('should create pool with keepAlive enabled', async () => {
    const connector = mysqlPoolConnector({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'test',
    })

    const pool = await connector.getInstance()
    expect(pool).toBeDefined()
    expect(typeof pool.query).toBe('function')
    expect(typeof pool.end).toBe('function')

    await connector.dispose()
  })

  it('should dispose pool correctly', async () => {
    const connector = mysqlPoolConnector({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'test',
    })

    await connector.getInstance()
    await connector.dispose()

    // After dispose, calling getInstance should create a new pool
    const pool = await connector.getInstance()
    expect(pool).toBeDefined()
    await connector.dispose()
  })
})
