const { ApolloServer, gql } = require("apollo-server-lambda");
const AWS = require("aws-sdk");
const uuid = require("uuid/v4");

AWS.config.update({
  region: "us-east-2",
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
});

const table = "todos";
const docClient = new AWS.DynamoDB.DocumentClient();

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    todos: [Todo]!
  }
  type Todo {
    id: ID!
    text: String!
    done: Boolean!
  }
  type Mutation {
    addTodo(text: String!): Todo
    updateTodoDone(id: ID!): Todo
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    todos: async (parent, args, { user }) => {
      if (!user) {
        return [];
      } else {
        const params = {
          TableName: table,
          KeyConditionExpression: "pk = :userid and begins_with(sk, :todokey)",
          ExpressionAttributeValues: {
            ":userid": `user#${user}`,
            ":todokey": "todo#"
          }
        };
        const result = await docClient.query(params).promise();
        return result.Items.map(({ pk, sk, data }) => {
          return {
            id: sk.replace("todo#", ""),
            ...data
          };
        });
      }
    }
  },
  Mutation: {
    addTodo: async (_, { text }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to insert todos");
      }
      const todoUuid = uuid();
      const params = {
        TableName: table,
        Item: {
          pk: `user#${user}`,
          sk: `todo#${todoUuid}`,
          data: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            done: false,
            text
          }
        }
      };
      await docClient.put(params).promise();
      return {
        id: todoUuid,
        done: false,
        text
      };
    },
    updateTodoDone: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to insert todos");
      }
      const params = {
        TableName: table,
        Key: {
          pk: `user#${user}`,
          sk: `todo#${id}`
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

      const { pk, sk, data } = result.Attributes;
      return {
        id: sk.replace("todo#", ""),
        text: data.text,
        done: data.done
      };
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ event }) => {
    if (event.requestContext.authorizer.principalId) {
      return { user: event.requestContext.authorizer.principalId };
    } else {
      return {};
    }
  },
  // By default, the GraphQL Playground interface and GraphQL introspection
  // is disabled in "production" (i.e. when `process.env.NODE_ENV` is `production`).
  //
  // If you'd like to have GraphQL Playground and introspection enabled in production,
  // the `playground` and `introspection` options must be set explicitly to `true`.
  playground: true,
  introspection: true
});

module.exports = server.createHandler({
  cors: {
    origin: "*",
    credentials: true
  }
});
