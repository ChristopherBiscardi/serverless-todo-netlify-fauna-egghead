const React = require("react");
const netlifyIdentity = require("netlify-identity-widget");

const IdentityContext = React.createContext({});

exports.IdentityContext = IdentityContext;

const IdentityProvider = props => {
  const [user, setUser] = React.useState();

  React.useEffect(() => {
    netlifyIdentity.init({});
  });
  netlifyIdentity.on("login", user => {
    setUser(user);
  });
  netlifyIdentity.on("logout", () => setUser());

  return (
    <IdentityContext.Provider value={{ identity: netlifyIdentity, user }}>
      {props.children}
    </IdentityContext.Provider>
  );
};

exports.Provider = IdentityProvider;
