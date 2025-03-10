// app.js
const fs = require('fs');

const emergencyLabel = process.env.EMERGENCY_LABEL || 'emergency';

/**
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  //context.log("Yay! The app was loaded!");
  app.on("pull_request.labeled", async (context) => {
    let authorized = await isAuthorized(context)
    if (context.payload.label.name == emergencyLabel 
        && context.payload.pull_request.merged == false  
        && authorized) {
      // emergency label exists and pull request is not merged, so do stuff...
      context.log(`${emergencyLabel} label detected`);

      let errorsArray = [];
      let newIssue

      // Approve PR, if configured to do so
      if (process.env.APPROVE_PR == 'true') {
        context.log(`Adding review to PR`);
        await context.octokit.rest.pulls.createReview({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.pull_request.number,
          body: "Approved by emergency PR bot",
          event: "APPROVE"
        }).then(response => {
          context.log(`Review added`);
        }).catch(error => {
          context.log(`Error adding review: ${error}`);
          errorsArray.push(error);
        });
      }

      // Create issue, if configured to do so
      if (process.env.CREATE_ISSUE == 'true') {
        context.log(`Creating issue`);
        let assignees = {};
        if (typeof process.env.ISSUE_ASSIGNEES !== 'undefined' && process.env.ISSUE_ASSIGNEES != "") {
          let assigneesArray = process.env.ISSUE_ASSIGNEES.split(",");
          assignees = {"assignees": assigneesArray.map(s => s.trim())};
        }
        let issueBody = fs.readFileSync(process.env.ISSUE_BODY_FILE, 'utf8');
        issueBody = issueBody.replace('#',context.payload.pull_request.html_url);
        await context.octokit.rest.issues.create({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          title: process.env.ISSUE_TITLE,
          body: issueBody,
          labels: [emergencyLabel],
          ...assignees
        }).then(response => {
          context.log(`Issue created`)
          newIssue = response.data.html_url;
        }).catch(error => {
          context.log(`Error creating issue: ${error}`)
          newIssue = 'Failed to create issue';
          errorsArray.push(error);
        });
      }

      // Merge PR, if configured to do so
      if (process.env.MERGE_PR == 'true') {
        context.log(`Merging PR`);
        let mergeMethod;
        if (context.payload.pull_request.base.repo.allow_merge_commit == true) {
          mergeMethod = 'merge';
        } else if (context.payload.pull_request.base.repo.allow_squash_merge == true) {
          mergeMethod = 'squash';
        } else {
          mergeMethod = 'rebase';
        }
        await context.octokit.rest.pulls.merge({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.pull_request.number,
          merge_method: mergeMethod
        }).then(response => {
          context.log(`PR merged`);
        }).catch(error => {
          context.log(`Error merging PR: ${error}`);
          errorsArray.push(error);
        });
      }

      // Slack notify, if configured to do so
      if (process.env.SLACK_NOTIFY == 'true') {
        let slackMessage = fs.readFileSync(process.env.SLACK_MESSAGE_FILE, 'utf8');
        slackMessage = slackMessage.replace('#pr',context.payload.pull_request.html_url);
        if (typeof newIssue !== 'undefined' && newIssue != "") {
          slackMessage = slackMessage.replace('#i',newIssue);
        }
        slackMessage = slackMessage.replace('#l',emergencyLabel);
        const { WebClient, retryPolicies } = require('@slack/web-api');
        
        // Read a token from the environment variables
        const token = process.env.SLACK_BOT_TOKEN;
        let retryConfig = retryPolicies.fiveRetriesInFiveMinutes;
        if (process.env.SLACK_RETYRY_CONFIG == '0') {
          retryConfig = {
            retries: 0
          };
        }
        // Initialize
        const web = new WebClient(token, {
          retryConfig: retryConfig,
          headers: {
            'User-Agent': 'MyApp/1.0'
          }
        });

        // Send message
        context.log("Sending slack message");
        await web.chat.postMessage({
          text: slackMessage,
          channel: process.env.SLACK_CHANNEL_ID
        }).then(response => {
          context.log(`Slack notification sent`);
        }).catch(error => {
          context.log(`Error sending slack notification: ${error}`);
          errorsArray.push(error);
        });
      }

      // Return errors, or true if no errors
      if (errorsArray.length > 0) {
        context.log(`Errors: ${errorsArray}`);
        throw errorsArray;
      } else {
        return true;
      }
    } else if (context.payload.label.name == emergencyLabel 
      && context.payload.pull_request.merged == false  
      && ! authorized) {
        await postUnauthorizedIssueComment(context)
        // remove emergency label
        await context.octokit.rest.issues.removeLabel({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: context.payload.pull_request.number,
          name: emergencyLabel
        })
      }
  });

  app.on("pull_request.unlabeled", async (context) => {
    if (context.payload.label.name == emergencyLabel 
        && process.env.EMERGENCY_LABEL_PERMANENT == 'true'
        && ! context.payload.sender.login.endsWith("[bot]")) {

      // emergencyLabel was removed and it should be permanent, so do stuff...
      context.log(`Reaplying ${emergencyLabel} label to PR: ${context.payload.pull_request.html_url}`);

      let errorsArray = [];

      // Add emergency label
      await context.octokit.rest.issues.addLabels({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.pull_request.number,
        labels: [emergencyLabel]
      }).then(response => {
        context.log(`${emergencyLabel} label reapplied to PR: ${context.payload.pull_request.html_url}`);
      }).catch(error => {
        context.log(`Error reapplying ${emergencyLabel} label: ${error} to PR: ${context.payload.pull_request.html_url}`);
        errorsArray.push(error);
      });

      // Return errors, or true if no errors
      if (errorsArray.length > 0) {
        context.log(`Errors: ${errorsArray}`);
        throw errorsArray;
      } else {
        return true;
      }
    }
  });

  app.on("issues.unlabeled", async (context) => {
    if (context.payload.label.name == emergencyLabel
        && process.env.EMERGENCY_LABEL_PERMANENT == 'true' 
        && ! context.payload.sender.login.endsWith("[bot]")) {

      // emergencyLabel was removed and it should be permanent, so do stuff...
      context.log(`Reaplying ${emergencyLabel} label to PR: ${context.payload.issue.html_url}`);

      let errorsArray = [];

      // Add emergency label
      await context.octokit.rest.issues.addLabels({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        labels: [emergencyLabel]
      }).then(response => {
        context.log(`${emergencyLabel} label reapplied to PR: ${context.payload.issue.html_url}`);
      }).catch(error => {
        context.log(`Error reapplying ${emergencyLabel} label: ${error} to PR: ${context.payload.issue.html_url}`);
        errorsArray.push(error);
      });

      // Return errors, or true if no errors
      if (errorsArray.length > 0) {
        context.log(`Errors: ${errorsArray}`);
        throw errorsArray;
      } else {
        return true;
      }
    }
  });

  app.on("pull_request.opened", async (context) => {
    let authorized = await isAuthorized(context)
    if (context.payload.pull_request.body.toLocaleLowerCase().includes(process.env.TRIGGER_STRING) 
        && authorized) {

      // Found the trigger string, so add the emergency label to trigger the other stuff...
      let errorsArray = [];
      await context.octokit.rest.issues.addLabels({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.pull_request.number,
        labels: [emergencyLabel]
      }).then(response => {
        context.log(`${emergencyLabel} label applied to PR: ${context.payload.pull_request.html_url}`);
        newIssue = response.data.html_url;
      }).catch(error => {
        context.log(`Error applying ${emergencyLabel} label: ${error} to PR: ${context.payload.pull_request.html_url}`);
        errorsArray.push(error);
      });

      // Return errors, or true if no errors
      if (errorsArray.length > 0) {
        context.log(`Errors: ${errorsArray}`);
        throw errorsArray;
      } else {
        return true;
      }
    } else if (context.payload.pull_request.body.toLocaleLowerCase().includes(process.env.TRIGGER_STRING) 
    && ! authorized){
      await postUnauthorizedIssueComment(context)
    }
  });

  app.on("issue_comment.created", async (context) => {
    let authorized = await isAuthorized(context)
    if (context.payload.issue.pull_request 
        && context.payload.comment.body.toLocaleLowerCase().includes(process.env.TRIGGER_STRING) 
        && authorized) {

      // This is a comment on a PR and we found the trigger string, so add the emergency label to trigger the other stuff...
      let errorsArray = [];
      await context.octokit.rest.issues.addLabels({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number,
        labels: [emergencyLabel]
      }).then(response => {
        context.log(`${emergencyLabel} label applied to PR: ${context.payload.issue.pull_request.html_url}`);
        newIssue = response.data.html_url;
      }).catch(error => {
        context.log(`Error applying ${emergencyLabel} label: ${error} to PR: ${context.payload.issue.pull_request.html_url}`);
        errorsArray.push(error);
      });

      // Return errors, or true if no errors
      if (errorsArray.length > 0) {
        context.log(`Errors: ${errorsArray}`);
        throw errorsArray;
      } else {
        return true;
      }
    } else if (context.payload.issue.pull_request 
        && context.payload.comment.body.toLocaleLowerCase().includes(process.env.TRIGGER_STRING) 
        && ! authorized) {
          await postUnauthorizedIssueComment(context)
        }
  });
};

async function isAuthorized(context) {
  let login = context.payload.sender.login;
  let org = context.payload.organization.login;
  let octokit = context.octokit;

  // check if process.env.AUTHORIZED_TEAM  is defined
  if (process.env.AUTHORIZED_TEAM == undefined || process.env.AUTHORIZED_TEAM == "") {
      context.log("No authorized team specified. Skipping authorization check.")
      return true;
  }
  // if login ends with [bot] then it's a bot and we don't need to check
  if (login.endsWith("[bot]")) {
      context.log("Bot detected. Skipping authorization check.")
      return true;
  }
  context.log(`Checking if ${login} is a member of ${org}/${process.env.AUTHORIZED_TEAM} team`)
  try {
      let membership = await octokit.request(`GET /orgs/${org}/teams/${process.env.AUTHORIZED_TEAM}/memberships/${login}`, {
          org: org,
          team_slug: process.env.AUTHORIZED_TEAM,
          username: login
      })

      if (membership.data.state == 'active') {
          context.log( "Membership active")
          return true;
      } else {
          context.log( "Membership not active")
          return false;

      }
  } catch (error) {
      if (error.status == 404) {
        context.log("Membership not found")
        return false;
      } else {
        context.log(`error: ${error}`);
        context.log("Error checking membership. Check the ADMIN_OPS_ORG and ACTIONS_APPROVER_TEAM variables.")
        throw new Error("Error checking membership");
      }
  }
}

async function postUnauthorizedIssueComment(context) {
  // Comment on github issue that user is not authorized to apply the emergency label
  let errorsArray = [];
  let number = context.payload.issue ? context.payload.issue.number : context.payload.pull_request.number
  let url = context.payload.issue ? context.payload.issue.html_url : context.payload.pull_request.html_url
  await context.octokit.rest.issues.createComment({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    issue_number: number,
    body: `@${context.payload.sender.login} is not authorized to apply the emergency label.`
  }).then(response => {
    context.log(`Commented on issue: ${url}`);
  }).catch(error => {
    context.log(`Error commenting on issue: ${error} to PR: ${url}`);
    errorsArray.push(error);
  });

  if (errorsArray.length > 0) {
    context.log(`Errors: ${errorsArray}`);
    throw errorsArray;
  } else {
    return true;
  }
}