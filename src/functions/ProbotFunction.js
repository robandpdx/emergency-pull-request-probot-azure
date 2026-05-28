const { app } = require('@azure/functions');
const {
  createAzureFunctionV4,
  createProbot,
  ProbotOctokit,
} = require("@probot/adapter-azure-functions");
const probotapp = require("../app");

// Pin the GitHub REST API version on every request so we don't fall back to
// the default (2022-11-28), which is scheduled to be retired on 2028-03-10
// and triggers `[@octokit/request] ... is deprecated` warnings on every call.
const PinnedApiVersionOctokit = ProbotOctokit.defaults({
  userAgent: "emergency-pull-request-probot-azure",
  request: {
    headers: {
      "X-GitHub-Api-Version": "2026-03-10",
    },
  },
});

app.http('ProbotFunction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createAzureFunctionV4(probotapp, {
      probot: createProbot({
        overrides: {
          Octokit: PinnedApiVersionOctokit,
        },
      }),
    }),
});
