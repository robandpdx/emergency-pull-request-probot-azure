# Emergency PR GitHub App - Azure Function

This project is a probot app deploying to an [Azure Function](https://learn.microsoft.com/en-us/azure/azure-functions/functions-overview?pivots=programming-language-csharp). This project is based on [emergency-pull-request-probot-app](https://github.com/github/emergency-pull-request-probot-app), and the code is basically the same. The purpose of this app is to provide a way for developers to bypass approval and checks in order to merge an emergency change to the protected main branch while ensuring that this bypass doesn't go unnoticed by creating an issue and/or slack notification.

The app listens for [Pull Request events](https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestevent) where action=`labeled` and can do 4 things:
1. Approve an emergency PR
1. Merge the emergency PR, bypassing approvals and checks
1. Create an issue to audit the emergency PR
1. Send notification via slack

Each of the above can be toggled on or off using the following environment variables which are meant to be self explanatory:
`APPROVE_PR, MERGE_PR, CREATE_ISSUE, SLACK_NOTIFY`
Setting each of the above to `true` will enable the feature. Any other value will disable the feature.

To configure the emergency label this app is looking for, set `EMERGENCY_LABEL` env var.

The issue this app will create can be configured by setting the `ISSUE_TITLE`, and `ISSUE_BODY_FILE`. The `ISSUE_BODY_FILE` is a markdown file used to create the issue. The # in that file will be replaced with a link to the PR and display the PR#. That link will look like this...  
[#19](https://github.com/robandpdx-volcano/superbigmono/pull/19)

The slack notification can be configured by setting the `SLACK_MESSAGE_FILE`. There are some dynamic replacements in this file that occur before the message is sent:
 - `#pr` is replaced with the url to the pull request
 - `#l` is replaced with the label configured in `EMERGENCY_LABEL`
 - `#i` is replaced with the url to the issue created, if issue creation is enabled
## Environment setup
### Create GitHub App
Create the GH App in your org or repo. Define a client secrent. Generate a private key.
#### Grant repository permissions
Set Contents access to `Read & write`  
Set Issues access to `Read & write`  
Set Pull Requests access to `Read & write`  
#### Grant organization permissions
Set members access to `Read-only`
#### Subscripe to events
Check `Issues`  
Check `Issue comment`  
Check `Pull request`

#### Allow app to bypass branch protection
If you want the app to merge the emergency PR, and have configured "Require status checks to pass before merging" in your branch protection rule, you will need to allow the app to bypass branch protection.

If you want the app to merge the emergency PR, and have configured "Restrict who can push to matching branches" in your branch projection rule, you will need to allow the app push access to the matching branches.

Once you have the bot user setup and the GitHub app configured you are ready to deploy!

### Create a Slack App
1. Navigate to your slack workspace `https://<workspace-name>.slack.com/home`
1. In the menu on the left, under `Other`, click the `API` link
1. Click `Create an app`
1. Create the app using the manifest file emergency-pr-manifest.yml
## Deployment
Get the following details about your GitHub app:
- `APP_ID`
- `WEBHOOK_SECRET`
- `PRIVATE_KEY` (base64 encoded)

You will need to base64 encode the private key.

You will also need a user and PAT with admin permissions on the repos in order to merge bypassing checks and required approvals. These will be supplied to the app as the following env vars:
- `GITHUB_USER`
- `GITHUB_PAT`

Get the following details about your Slack app:
- `SLACK_BOT_TOKEN`

Also go find the `SLACK_CHANNEL_ID` for the channel you want to send notifications to.  
You will need to configure the contents of the slack message by setting value of `SLACK_MESSAGE_FILE` and editing the contents of that file.

You will need to decide the label that this app looks for, the contents of the issue, and the assignee of the issue:
- `EMERGENCY_LABEL`  This is the label that indicates an emergency PR
- `ISSUE_TITLE`  This is the title of the issue created
- `ISSUE_BODY_FILE`  This is the file containing the body of the issue created
- `ISSUE_ASSIGNEES`  This is a comma separated list of the issue assignees

Optionally, you can define a team name in the `AUTHORIZED_TEAM` variable. The app will consider members of this team authorized to use this app. The app will add a comment on the PR if an user who is not a member of this team attemps to do any of the following:  
- Opens a PR with the `TRIGGER_STRING` in the body  
- Adds a PR comment with the `TRIGGER_STRING` in the body  
- Adds the `EMERGENCY_LABEL` to a PR  

The comment will read:  
```
@username is not authorized to apply the emergency label.
```

To make the emergency label permanent set `EMERGENCY_LABEL_PERMANENT` to true. Doing this will cause the app to reapply the emergency label if it is removed.
To trigger the label (and therefore everything configured) set `TRIGGER_STRING` to the value you want the app to look for in PRs and PR comments.

### Create supporting azure resources for the function
1. Login to azure
```
az login
```
2. Copy the `.env-sample` file to `.env` and edit as needed
3. Run the `scripts/create-azure-resources.sh` script

4. (Optional) Show the function app settings...
```
az functionapp config appsettings list --name $AZURE_FUNCTION_APP --resource-group $AZURE_RESOURCE_GROUP
```

### Deploy the function
```
func azure functionapp publish $AZURE_FUNCTION_APP
```

## Test the function locally
Get the $AZURE_STORAGE_ACCOUNT connection string and set it as the value of `AzureWebJobsStorage` in the `local.settings.json` file.  
Start the vscode debugger `Attach to Node Functions`.  
Start smee client...
```
smee -u $WEBHOOK_PROXY_URL -t http://localhost:7071/api/ProbotFunction
```
Then send in a paylaod from Github by configuring the webhook URL to $WEBHOOK_PROXY_URL. Can resend payloads through app advanced settings or via smee web ui. 

## Notes
 - If you change the settings in `.env`, close vscode and relaunch from the terminal after loading changes from direnv.  
 - I'm not sure why the integrated probot smee client does not work. Need to use the use the smee client separately as described above.  
 - To see vebose logging while debugging, edit the task.json, `"command": "host start --verbose",`.  