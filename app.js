const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const path = require('path')
const bodyParser = require('body-parser')

//routers
const authRouter = require('./routes/authRoute')
const staticRouter = require('./routes/staticRoutes')
const workoutRouter = require('./routes/workoutRoute')
const userRouter = require('./routes/userRoute')
const dashboardRouter = require('./routes/dashboardRoutes')
const paymentRouter = require('./routes/paymentRoutes')

const app = express()
app.use(express.json())
app.use(bodyParser.json())

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(
  cors({
    origin: 'http://localhost:3000/', // Set the allowed frontend URL here
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow credentials (cookies)
  })
)

app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/auth', authRouter)
app.use('/', staticRouter)
app.use('/workout', workoutRouter)
app.use('/user', userRouter)
app.use('/dashboard', dashboardRouter)
app.use('/payments', paymentRouter)

module.exports = app
