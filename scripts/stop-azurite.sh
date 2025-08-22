#!/bin/bash
# Stop Azurite processes

echo "Stopping Azurite..."
pkill -f azurite

if [ $? -eq 0 ]; then
    echo "Azurite stopped successfully."
else
    echo "No Azurite processes found running."
fi