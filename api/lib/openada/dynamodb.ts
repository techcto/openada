import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export function createDynamoDocumentClient(): DynamoDBDocumentClient {
  const endpoint = String(process.env.OPENADA_DYNAMODB_ENDPOINT || '').trim()

  const client = endpoint
    ? new DynamoDBClient({
        endpoint,
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
        },
      })
    : new DynamoDBClient({})

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  })
}
