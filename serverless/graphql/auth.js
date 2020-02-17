const bent = require("bent");
const getJSON = bent("GET", "json");

const getToken = params => {
  if (!params.type || params.type !== "TOKEN") {
    throw new Error('Expected "event.type" parameter to have value "TOKEN"');
  }

  const tokenString = params.authorizationToken;
  if (!tokenString) {
    throw new Error('Expected "event.authorizationToken" parameter to be set');
  }

  const match = tokenString.match(/^Bearer (.*)$/);
  if (!match || match.length < 2) {
    throw new Error(
      `Invalid Authorization token - ${tokenString} does not match "Bearer .*"`
    );
  }
  return match[1];
};

const getPolicyDocument = (effect, resource) => {
  const policyDocument = {
    Version: "2012-10-17", // default version
    Statement: [
      {
        Action: "execute-api:Invoke", // default action
        Effect: effect,
        Resource: resource
      }
    ]
  };
  return policyDocument;
};

module.exports = async params => {
  const token = getToken(params);
  const user = await getJSON(
    "https://serverless-todo-netlify-fauna-egghead.netlify.com/.netlify/identity/user",
    null,
    { Authorization: `Bearer ${token}` }
  );
  if (!user.id) {
    throw new Error("Netlify Identity Failed");
  }
  return {
    principalId: user.id,
    policyDocument: getPolicyDocument("Allow", params.methodArn)
  };
};
