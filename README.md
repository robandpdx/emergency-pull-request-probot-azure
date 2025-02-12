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
