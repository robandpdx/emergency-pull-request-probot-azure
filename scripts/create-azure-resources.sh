#!/bin/bash

# Create a resource group
az group create --name $AZURE_RESOURCE_GROUP --location $AZURE_LOCATION
# Create a storage account
az storage account create --name $AZURE_STORAGE_ACCOUNT --location $AZURE_LOCATION --resource-group AzureFunctionsQuickstart-rg --sku Standard_LRS --allow-blob-public-access false
# Create a function app
az functionapp create --resource-group $AZURE_RESOURCE_GROUP --consumption-plan-location $AZURE_LOCATION --runtime node --runtime-version 20 --functions-version 4 --name $AZURE_FUNCTION_APP --storage-account $AZURE_STORAGE_ACCOUNT

# Configure the function app settings
SETTINGS=(
    APP_ID
    PRIVATE_KEY
    WEBHOOK_SECRET
    SLACK_BOT_TOKEN
    APPROVE_PR
    CREATE_ISSUE
    MERGE_PR
    SLACK_NOTIFY
    EMERGENCY_LABEL_PERMANENT
    ISSUE_TITLE
    ISSUE_BODY_FILE
    _ISSUE_ASSIGNEES
    EMERGENCY_LABEL
    TRIGGER_STRING
    SLACKE_CHANNEL_ID
    SLACK_MESSAGE_FILE
)
for setting in "${SETTINGS[@]}"; do
    az functionapp config appsettings set --name $AZURE_FUNCTION_APP --resource-group $AZURE_RESOURCE_GROUP --settings "$setting"="${!setting}"
done

# Deploy the function
func azure functionapp publish $AZURE_FUNCTION_APP