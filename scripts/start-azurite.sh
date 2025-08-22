#!/bin/bash
# Start Azurite (Azure Storage Emulator) in the background
# This will create the storage directory if it doesn't exist

AZURITE_DIR="$HOME/.azurite"
mkdir -p "$AZURITE_DIR"

echo "Starting Azurite..."
echo "Blob Service: http://localhost:10000"
echo "Queue Service: http://localhost:10001"
echo "Table Service: http://localhost:10002"
echo ""
echo "Default storage account: devstoreaccount1"
echo "Default storage key: Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=="
echo ""
echo "Connection string:"
echo "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://localhost:10000/devstoreaccount1;QueueEndpoint=http://localhost:10001/devstoreaccount1;TableEndpoint=http://localhost:10002/devstoreaccount1;"
echo ""

azurite --silent --location "$AZURITE_DIR" --debug "$AZURITE_DIR/debug.log" &
AZURITE_PID=$!

echo "Azurite started with PID: $AZURITE_PID"
echo "To stop Azurite, run: kill $AZURITE_PID"
echo "Debug logs are available at: $AZURITE_DIR/debug.log"