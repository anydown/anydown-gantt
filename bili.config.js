module.exports = {
  input: "src/components/gantt.vue",
  output: {
    format: ["esm", "umd"],
    moduleName: "anydown-gantt",
    fileName({ format }) {
      if (format === "esm") {
        return "anydown-gantt.es.js";
      }
      return "anydown-gantt.js";
    }
  },
  plugins: {
    vue: true
  }
};
