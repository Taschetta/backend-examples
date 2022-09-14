import express from 'express'
import myslq from 'mysql2/promise'

class BadRequestError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BadRequestError'
    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, BadRequestError)
    }
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NotFoundError'
    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError)
    }
  }
}

const APP_PORT = process.env.APP_PORT

const database = myslq.createPool({
  connectionLimit: 10,
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
})

function handle(callback) {
  return async function(req, res, next) {
    try {
      await callback(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

const app = express()

app.use(express.json())

// find

app.get('/users/:id', handle(async (req, res) => {
  const id = parseInt(req.params.id)

  if(!id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  const [rows] = await database.query(
    `SELECT * FROM user WHERE id = ? LIMIT 1`,
    [id]
  )

  if(rows.length === 0) {
    throw new NotFoundError('No se encontró el usuario')
  }
  
  res.send({
    success: true,
    user: rows[0]
  })
}))

// update

app.put('/users/:id', handle(async (req, res) => {
  let id = parseInt(req.params.id)

  const user = {}

  user.name = req.body.name
  user.email = req.body.email
  

  if(!id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  if(!user.name) {
    throw new BadRequestError('Falta definir el nombre')
  }

  if(!user.email) {
    throw new BadRequestError('Falta definir el email')
  }

  // create
  if(id === 0) {
    let response
    
    try {
      response = await database.query(
        'INSERT INTO `user` (`name`, `email`) VALUES ?', 
        [Object.values(user)]
      )      
    } catch (error) {
      if(error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestError('Ya existe un usuario con el mismo mail')
      }
      throw error
    }
    
    id = response[0].insertId
  }
  // update
  else {
    try {
      await database.query('UPDATE `user` SET ? where id = ?',[user, id])
    } catch (error) {
      if(error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestError('Ya existe un usuario con el mismo mail')
      }
      throw error
    }
  }

  return res.send({
    success: true,
    id,
  })

}))

app.delete('/users/:id', handle(async (req, res) => {
  const id = parseInt(req.params.id)

  if(!id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  const [response] = await database.query('delete from user where id = ?', id)

  if(response.affectedRows === 0) {
    throw new NotFoundError('No se encontró el usuario a eliminar')
  }

  res.send({
    success: true,
    id,
  })
}))

// insert 

app.post('/users', handle(async (req, res) => {
  if(!Array.isArray(req.body)) {
    req.body = [req.body]
  }
  
  const users = req.body.map((user) => {
    if(!user.name) {
      throw new BadRequestError('Falta definir el nombre')
    }

    if(!user.email) {
      throw new BadRequestError('Falta definir el email')
    }

    return {
      name: user.name,
      email: user.email,
    }
  })
  
  let response
  
  try {
    response = await database.query(
      'INSERT INTO `user` (`name`, `email`) VALUES ?', 
      [users.map(user => Object.values(user))]
    )      
  } catch (error) {
    switch (error.code) {
      case 'ER_DUP_ENTRY': throw new BadRequestError('Ya existe un usuario con el mismo mail')
      default: throw error
    }
  }
  
  res.send({
    success: true,
    id: response[0].insertId,
  })
}))

// filter

app.get('/users', handle(async (req, res) => {
  let name = req.query.name
  let email = req.query.email

  if(name) name = `%${name}%`
  if(email) email = `%${email}%`

  const [rows] = await database.query(`
    SELECT * from user WHERE
    (? is NULL or name like ?) and
    (? is NULL or email like ?)
  `, [
    name, name,
    email, email
  ])

  res.send({
    success: true,
    users: rows
  })
}))

app.use((error, req, res, next) => {
  console.log(error)
  switch (error.name) {
    case 'BadRequestError':
      res.status(400).send({ success: false, message: error.message || 'Los datos ingresados son invalidos' })
    case 'NotFoundError':
      res.status(404).send({ success: false, message: error.message || 'No encontramos lo que estabas buscando' })
    default:
      res.status(500).send({ success: false, message: 'Se produjo un error.' })
      break;
  }
})

app.listen(APP_PORT, () => {
  console.log(`Listening on port ${APP_PORT}`)
})