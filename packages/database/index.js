import myslq from 'mysql2/promise'

const DATABASE_HOST = process.env.DATABASE_HOST
const DATABASE_USER = process.env.DATABASE_USER
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD
const DATABASE_NAME = process.env.DATABASE_NAME

const pool = myslq.createPool({
  connectionLimit: 10,
  host: DATABASE_HOST,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
})

export async function query(sql, values) {
  const response = await pool.query(sql, values)
  if(Array.isArray(response[0])) {
    return {
      insertId: null,
      affectedRows: null,
      changedRows: null,
      rows: response[0],
    }
  }
  return {
    insertId: response[0].insertId || null,
    affectedRows: response[0].affectedRows || 0,
    changedRows: response[0].changedRows || 0,
    rows: [],
  }
}

export async function find(table, column, value) {
  const response = await query(
    `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`, [table, column, value]
  )

  if(response.rows.length === 0) {
    return null
  }

  return response.rows[0]
}

export async function save(table, { id, ...data }) {
  if(id === 0) {
    return await insert(table, data)
  }
  
  const updated = await update(table, id, data)
  
  if(!updated) {
    return null
  }
  
  return id
}

export async function insert(table, data) {
  if(!Array.isArray(data)) {
    data = [data]
  }
  
  const response = await query(
    'INSERT INTO ?? (??) VALUES ?', 
    [
      table,
      Object.keys(data[0]),
      data.map(item => Object.values(item)),
    ]
  )

  return response.insertId
}

export async function update(table, id, data) {
  const response = await query('UPDATE ?? SET ? where id = ?', [table, data, id]) 
  return response.affectedRows
}

export async function remove(table, column, value) {
  const response = await query('delete from ?? where ?? = ? limit 1', [table, column, value])
  return response.affectedRows
}

export function table(table) {
  return {
    query,
    find: (column, value) => find(table, column, value),
    save: (data) => save(table, data),
    insert: (data) => insert(table, data),
    update: (id, data) => update(table, id, data),
    remove: (column, value) => remove(table, column, value),
  }
}

export default {
  query,
  table,
  find,
  save,
  insert,
  update,
  remove,
}