import AWS from "aws-sdk";
import commonMiddleware from "./lib/commonMiddleware";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function Auctiongetbyid(id) {
  let auction;

  try {
    const result = await dynamodb
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
      })
      .promise();

    auction = result.Item;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  if (!auction) {
    throw new createError.NotFound(`Such auction does not exist`);
  }

  return auction;
}
async function Auctionget(event, context) {
  const { id } = event.pathParameters;

  const auction = await Auctiongetbyid(id);

  return {
    statusCode: 200, //resource fetched
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(Auctionget);
