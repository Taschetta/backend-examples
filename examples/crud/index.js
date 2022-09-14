import express from 'express'
import * as routes from './routes.js'

const APP_PORT = process.env.APP_PORT

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

app.route('/users/:id')
  .get(handle(routes.users.find))
  .put(handle(routes.users.update))
  .delete(handle(routes.users.remove))

app.route('/users')
  .get(handle(routes.users.filter))
  .post(handle(routes.users.insert))

app.use((error, req, res, next) => {
  console.log(error)
  switch (error.name) {
    case 'BadRequestError':
      res.status(400).send({ success: false, message: error.message || 'Los datos ingresados son invalidos' })
      break;
    case 'NotFoundError':
      res.status(404).send({ success: false, message: error.message || 'No encontramos lo que estabas buscando' })
      break;
    default:
      res.status(500).send({ success: false, message: 'Se produjo un error.' })
      break;
  }
})

app.listen(APP_PORT, () => {
  console.log(`Listening on port ${APP_PORT}`)
})