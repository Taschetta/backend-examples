import express from 'express'

const APP_PORT = process.env.APP_PORT

const app = express()

app.use(express.json())

// find

app.post

app.get('/prueba/:id', (request, response) => {
  const datos = request.body

  datos.otraVariable = 'variable2'
  
  response.send({
    datos
  })
})

app.listen(APP_PORT, () => {
  console.log(`Listening on port ${APP_PORT}`)
})
