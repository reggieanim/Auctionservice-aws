import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";
import createError from "http-errors";
import validator from "@middy/validator";
import commonMiddleware from "./lib/commonMiddleware";
import createAuctionSchema from "./lib/schemas/createAuctionSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function Auctioncreate(event, context) {
  const { title } = event.body;
  const { email } = event.requestContext.authorizer;
  const timenow = new Date();
  const endDate = new Date();
  endDate.setHours(timenow.getHours() + 1);

  //initiate auction object
  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: timenow.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  };

  try {
    //push to database
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201, //resource created
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(Auctioncreate).use(
  validator({
    inputSchema: createAuctionSchema,
  })
);
