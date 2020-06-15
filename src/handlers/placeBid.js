import AWS from "aws-sdk";
import validator from "@middy/validator";
import createError from "http-errors";
import { Auctiongetbyid } from "./Auctionget";
import commonMiddleware from "./lib/commonMiddleware";
import placeBidSchema from "./lib/schemas/placeBidSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await Auctiongetbyid(id);

  if (auction.status !== "OPEN") {
    throw new createError.Forbidden(`You cannot bid on closed auctions`);
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(
      `Bid must be higher than ${auction.highestBid.amount}`
    );
  }

  if (email === auction.highestBid.bidder) {
    throw new createError.Forbidden(
      `You are always the highest bidder`
    );
  }

  if (email === auction.seller) {
    throw new createError.Forbidden(
      `You cannot bid on your auction`
    );
  }
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": email,
    },
    ReturnValues: "ALL_NEW",
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200, //resource fetched
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid).use(
  validator({
    inputSchema: placeBidSchema,
  })
);
