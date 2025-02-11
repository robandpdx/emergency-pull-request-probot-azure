# Probot azure function

I followed the instructions [here](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-cli-node?tabs=macos%2Cazure-cli%2Cbrowser&pivots=nodejs-model-v4#create-a-local-function-project) to setup the function.  

## Create supporting azure resources for the function
1. Create a resource group
```
az login
az group create --name AzureFunctionsQuickstart-rg --location <REGION>
```
2. Create a storage account
```
az storage account create --name <STORAGE_NAME> --location <REGION> --resource-group AzureFunctionsQuickstart-rg --sku Standard_LRS --allow-blob-public-access false
```
3. Create a function app
```
az functionapp create --resource-group AzureFunctionsQuickstart-rg --consumption-plan-location <REGION> --runtime node --runtime-version 18 --functions-version 4 --name <APP_NAME> --storage-account <STORAGE_NAME>
```

## Configure function app settings
```
az functionapp config appsettings set --name probotrobandpdx --resource-group Probot-rg
 --settings APP_ID=$APP_ID
az functionapp config appsettings set --name probotrobandpdx --resource-group Probot-rg
 --settings PRIVATE_KEY=$PRIVATE_KEY
az functionapp config appsettings set --name probotrobandpdx --resource-group Probot-rg
 --settings WEBHOOK_SECRET=$WEBHOOK_SECRET
```

Show the settings...
```
az functionapp config appsettings list --name probotrobandpdx --resource-group Probot-rg
```

## Deploy the function
```
func azure functionapp publish probotrobandpdx
```



Set the following 