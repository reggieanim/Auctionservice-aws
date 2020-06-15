import AWS from "aws-sdk";
import commonMiddleware from "./lib/commonMiddleware";
import validator from "@middy/validator";
import createError from "http-errors";
import getAuctionsSchema from "./lib/schemas/getAuctionsSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function Auctionsget(event, context) {
  const { status } = event.queryStringParameters;
  let auctions;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeValues: {
      ":status": status,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  try {
    const result = await dynamodb.query(params).promise();

    auctions = result.Items;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200, //resource fetched
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(Auctionsget).use(
  validator({ inputSchema: getAuctionsSchema, useDefaults: true })
);
