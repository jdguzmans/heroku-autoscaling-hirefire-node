require('dotenv').config()

const cron = require('node-cron')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'us-east-1' })
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

const receiveMessages = () => {
  console.log(process.env.AWS_QUEUE_URL)
  return new Promise((resolve, reject) => {
    const params = {
      MaxNumberOfMessages: 2,
      MessageAttributeNames: [
        'All'
      ],
      QueueUrl: process.env.AWS_QUEUE_URL,
      VisibilityTimeout: 35,
      WaitTimeSeconds: 0
    }

    sqs.receiveMessage(params, (err, data) => {
      if (err) reject(err)
      else {
        const { Messages: messages } = data
        resolve(messages || [])
      }
    })
  })
}

const deleteMessage = (receipHandle) => {
  return new Promise((resolve, reject) => {
    const deleteParams = {
      QueueUrl: process.env.AWS_QUEUE_URL,
      ReceiptHandle: receipHandle
    }

    sqs.deleteMessage(deleteParams, (err, data) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

cron.schedule('*/20 * * * * *', async () => {
  console.log('cron started')
  // const messages = await receiveMessages()
  // for (let message of messages) {
  //   const { MessageAttributes: { attr1: { StringValue: attr1 } }, ReceiptHandle: receiptHandle } = message
  //   console.log(attr1)
  //   await deleteMessage(receiptHandle)
  // }
})
