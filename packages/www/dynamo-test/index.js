const AWS = require("aws-sdk");
const uuid = require("uuid/v4");

AWS.config.update({
  region: "us-east-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const table = "todos";
const docClient = new AWS.DynamoDB.DocumentClient();

async function run() {
  // const params = {
  //   TableName: table,
  //   Item: {
  //     pk: "user#1",
  //     sk: `todo#${uuid()}`,
  //     data: {
  //       createdAt: Date.now(),
  //       updatedAt: Date.now(),
  //       done: false
  //     }
  //   }
  // };
  // const result = await docClient.put(params).promise();

  const params = {
    TableName: table,
    Key: {
      pk: "user#1",
      sk: "todo#c6040ea7-3272-4696-b8ce-cc1d1c42f6ee"
    },
    UpdateExpression: "set #data.#done = :newdone",
    ExpressionAttributeNames: {
      "#data": "data",
      "#done": "done"
    },
    ExpressionAttributeValues: {
      ":newdone": true
    },
    ReturnValues: "ALL_NEW"
  };
  const result = await docClient.update(params).promise();

  // const params = {
  //   TableName: table,
  //   KeyConditionExpression: "pk = :userid and begins_with(sk, :todokey)",
  //   ExpressionAttributeValues: {
  //     ":userid": "user#1",
  //     ":todokey": "todo#"
  //   }
  // };
  // const result = await docClient.query(params).promise();
  console.log(JSON.stringify(result, null, 2));
}

run();
