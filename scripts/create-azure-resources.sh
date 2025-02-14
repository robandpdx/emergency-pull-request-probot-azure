#!/bin/bash

# Source the .env file
if [ -f ".env" ]; then
    source .env
else
    echo "Error: .env file not found."
    exit 1
fi

# Create a resource group
echo "Creating resource group $AZURE_RESOURCE_GROUP in $AZURE_LOCATION"
az group create --name $AZURE_RESOURCE_GROUP --location $AZURE_LOCATION
sleep 5
# Create a storage account
echo "Creating storage account $AZURE_STORAGE_ACCOUNT in $AZURE_LOCATION"
az storage account create --name $AZURE_STORAGE_ACCOUNT --location $AZURE_LOCATION --resource-group $AZURE_RESOURCE_GROUP --sku Standard_LRS --allow-blob-public-access false
sleep 5
# Create a function app
echo "Creating function app $AZURE_FUNCTION_APP in $AZURE_LOCATION"
az functionapp create --resource-group $AZURE_RESOURCE_GROUP --consumption-plan-location $AZURE_LOCATION --runtime node --runtime-version 20 --functions-version 4 --name $AZURE_FUNCTION_APP --storage-account $AZURE_STORAGE_ACCOUNT
sleep 5
# Configure the function app settings
echo "Configuring function app settings"
az functionapp config appsettings set --name $AZURE_FUNCTION_APP --resource-group $AZURE_RESOURCE_GROUP --settings \
    APP_ID="$APP_ID" \
    PRIVATE_KEY="$PRIVATE_KEY" \
    WEBHOOK_SECRET="$WEBHOOK_SECRET" \
    SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" \
    APPROVE_PR="$APPROVE_PR" \
    CREATE_ISSUE="$CREATE_ISSUE" \
    MERGE_PR="$MERGE_PR" \
    SLACK_NOTIFY="$SLACK_NOTIFY" \
    EMERGENCY_LABEL_PERMANENT="$EMERGENCY_LABEL_PERMANENT" \
    ISSUE_TITLE="$ISSUE_TITLE" \
    ISSUE_BODY_FILE="$ISSUE_BODY_FILE" \
    ISSUE_ASSIGNEES="$ISSUE_ASSIGNEES" \
    EMERGENCY_LABEL="$EMERGENCY_LABEL" \
    TRIGGER_STRING="$TRIGGER_STRING" \
    SLACK_CHANNEL_ID="$SLACK_CHANNEL_ID" \
    SLACK_MESSAGE_FILE="$SLACK_MESSAGE_FILE"