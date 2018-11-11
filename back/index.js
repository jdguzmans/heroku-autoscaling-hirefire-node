
require('dotenv').config()

const http = require('http')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())

const server = http.createServer(app)
server.listen(process.env.PORT)
server.on('listening', () => {
  console.log(`web server is running`)
})

const queueMessage = () => {
  return new Promise((resolve, reject) => {
    const params = {
      MessageBody: 'test',
      QueueUrl: process.env.AWS_QUEUE_URL,
      MessageAttributes: {
        'attr1': {
          DataType: 'String',
          StringValue: 'attr1Value'
        }
      }
    }

    sqs.sendMessage(params, (err, data) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

const router = express.Router()

router.get('/', async (req, res, next) => {
  for (let i = 0; i < 1; i++) {
    await queueMessage()
  }
  const params = {
    QueueUrl: process.env.AWS_QUEUE_URL,
    AttributeNames: [
      'ApproximateNumberOfMessages'
    ]
  }
  sqs.getQueueAttributes(params, (err, data) => {
    if (err) console.log(err, err.stack)
    else {
      res.send(data)
    }
  })
})

router.get(`/hirefire/${process.env.HIREFIRE_TOKEN}/info`, async (req, res, next) => {
  res.send([{
    'name': 'worker', 'quantity': await countWorkers()
  }])
})

const countWorkers = async () => {
  const numerOfMessages = await getApproximateNumberOfMessages()

  let numerOfWorkers
  if (numerOfMessages < 4) numerOfWorkers = 1
  else if (numerOfMessages < 8) numerOfWorkers = 2
  else if (numerOfMessages < 12) numerOfWorkers = 3
  else numerOfWorkers = 4

  return numerOfWorkers
}

const getApproximateNumberOfMessages = () => {
  return new Promise((resolve, reject) => {
    const params = {
      QueueUrl: process.env.AWS_QUEUE_URL,
      AttributeNames: [
        'ApproximateNumberOfMessages'
      ]
    }
    sqs.getQueueAttributes(params, (err, data) => {
      if (err) console.log(err, err.stack)
      else {
        const { Attributes: { ApproximateNumberOfMessages: numerOfMessages } } = data
        resolve(numerOfMessages)
      }
    })
  })
}

app.use('/', router)
