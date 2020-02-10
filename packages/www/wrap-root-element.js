const React = require("react");
const { ThemeProvider } = require("theme-ui");
const { deep } = require("@theme-ui/presets");
const { Provider } = require("./identity-context");

const tokens = {
  ...deep,
  sizes: { container: 1024 }
};

module.exports = ({ element }) => (
  <Provider>
    <ThemeProvider theme={tokens}>{element}</ThemeProvider>
  </Provider>
);
