# Emergency PR GitHub App

I followed the instructions [here](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-node?tabs=macos%2Cazure-cli%2Cbrowser&pivots=nodejs-model-v4#create-a-local-function-project) to setup the function.  

## Create supporting azure resources for the function
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

## Deploy the function
```
func azure functionapp publish $AZURE_FUNCTION_APP
```

## Tets the function locally
Start the vscode debugger `Attach to Node Functions`.  
Start smee client...
```
smee -u $WEBHOOK_PROXY_URL -t http://localhost:7071/api/ProbotFunction
```
Then send in a paylaod from Github by configuring the webhook URL to $WEBHOOK_PROXY_URL. Can resend payloads through app advanced settings or via smee web ui. 

## Notes
If you change the settings in `.env`, close vscode and relaunch from the terminal after loading changes from direnv.  
I'm not sure why the integrated probot smee client does not work. Need to use the use the smee client separately as described above.  
To see vebose logging while debugging, edit the task.json, `"command": "host start --verbose",`.  

## TODO
1. Make the issue creation work
2. Make the slack notify work