import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb'

const endpoint = String(process.env.OPENADA_DYNAMODB_ENDPOINT || '').trim()

if (!endpoint) {
  process.exit(0)
}

const client = new DynamoDBClient({
  endpoint,
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
  },
})

const tableNames = [
  process.env.OPENADA_SITES_TABLE,
  process.env.OPENADA_PAGES_TABLE,
  process.env.OPENADA_SCANS_TABLE,
  process.env.OPENADA_SCAN_JOBS_TABLE,
].filter(Boolean)

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function ensureTable(TableName) {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      await client.send(new DescribeTableCommand({ TableName }))
      return
    } catch (error) {
      if (error?.name !== 'ResourceNotFoundException') {
        if (attempt === 60) throw error
        await sleep(1000)
        continue
      }

      try {
        await client.send(new CreateTableCommand({
          TableName,
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          BillingMode: 'PAY_PER_REQUEST',
        }))
        return
      } catch (createError) {
        if (createError?.name !== 'ResourceInUseException') throw createError
      }
    }
  }

  throw new Error(`Timed out waiting for local DynamoDB table ${TableName}.`)
}

for (const tableName of tableNames) {
  await ensureTable(tableName)
}
