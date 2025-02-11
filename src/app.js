// app.js
module.exports = (app) => {
  app.on("issues.opened", async (context) => {
    const params = context.issue({ body: "Hello World!" });
    await context.octokit.issues.createComment(params);
  });
};