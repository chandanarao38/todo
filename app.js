const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())
module.exports = app

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProp = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

//API 1
app.get('/todos/', async (request, response) => {
  const {search_q = '', priority, status} = request.query
  let gettodoQuery = ''
  switch (true) {
    case hasPriorityAndStatusProp(request.query):
      gettodoQuery = `SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}'`
      break
    case hasPriorityProperty(request.query):
      gettodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'`
      break
    case hasStatusProperty(request.query):
      gettodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%' AND status = '${status}'`
      break
    default:
      gettodoQuery = `
                SELECT *
                FROM todo
                WHERE todo LIKE '%${search_q}%' `
  }
  const data = await db.all(gettodoQuery)
  response.send(data)
  console.log(data)
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT *
  FROM todo
  WHERE Id = ${todoId}
  `
  const result = await db.get(getTodoQuery)
  console.log(result)
  response.send(result)
})

//API 3
app.post('/todos/', async (request, response) => {
  const postTodoQuery = `
    INSERT INTO todo(Id, todo, priority, status)
    VALUES (10, "Finalize event theme", "HIGH", "TO DO")
  `
  const dbResponse = await db.run(postTodoQuery)
  const todoId = dbResponse.lastId
  response.send('Todo Successfully Added')
})

//API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  console.log(updateColumn)

  const previousTodoQuery = `
    SELECT * 
    FROM todo
    WHERE Id = ${todoId}
  `
  const previousTodo = await db.get(previousTodoQuery)
  console.log(previousTodo)

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body

  const updateTodoQuery = `
    UPDATE todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE Id = ${todoId};
  `
  const result = await db.run(updateTodoQuery)
  responseStatement = updateColumn + ' Updated'
  response.send(responseStatement)
  const resultpart = `SELECT * FROM todo WHERE Id = ${todoId}`
  console.log(await db.get(resultpart))
})

//API 5
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE Id = ${todoId}
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
  console.log('Todo Deleted')
})
