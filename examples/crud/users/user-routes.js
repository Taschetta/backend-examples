import database from '@packages/database'

import { BadRequestError, NotFoundError } from '../errors.js'

const table = database.table('user')

export async function find(req, res) {
  const id = parseInt(req.params.id)

  if(!id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  const user = await table.find('id', id)

  if(!user) {
    throw new NotFoundError('No se encontró el usuario')
  }
  
  res.send({
    success: true,
    user
  })
}

export async function update(req, res) {
  const user = {}
  
  user.id = parseInt(req.params.id)
  user.name = req.body.name
  user.email = req.body.email
  

  if(!user.id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  if(!user.name) {
    throw new BadRequestError('Falta definir el nombre')
  }

  if(!user.email) {
    throw new BadRequestError('Falta definir el email')
  }

  const id = await table.save(user)
    .catch(error => {
      if(error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestError('Ya existe un usuario con el mismo mail')
      }
      throw error
    })

  if(!id) {
    throw new NotFoundError('No encontramos el usuario')
  }
  
  res.send({
    success: true,
    id,
  })
}

export async function remove(req, res) {
  const id = parseInt(req.params.id)

  if(!id) {
    throw new BadRequestError('El id ingresado es invalido')
  }

  const removed = await table.remove('id', id)

  if(!removed) {
    throw new NotFoundError('No se encontró el usuario a eliminar')
  }

  res.send({
    success: true,
    id,
  })
}

export async function insert(req, res) {
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
  
  const id = await table.insert(users)
    .catch(error => {
      if(error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestError('Ya existe un usuario con el mismo mail')
      }
      throw error
    })
  
  res.send({
    success: true,
    id,
  })
}

export async function filter(req, res) {
  let name = req.query.name
  let email = req.query.email

  if(name) name = `%${name}%`
  if(email) email = `%${email}%`

  const response = await database.query(`
    SELECT * from user WHERE
    (? is NULL or name like ?) and
    (? is NULL or email like ?)
  `, [
    name, name,
    email, email
  ])

  res.send({
    success: true,
    users: response.rows
  })
}