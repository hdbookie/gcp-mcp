# GCP MCP with Enhanced Cloud Functions Support

A Model Context Protocol (MCP) server that enables AI assistants like Claude to interact with your Google Cloud Platform environment. This fork adds enhanced Cloud Functions support for debugging and management, allowing for natural language querying and management of your GCP resources during conversations.

![GCP MCP Demo](images/claude.png)

## Features

* 🔍 Query and modify GCP resources using natural language
* 🔧 **Enhanced Cloud Functions support for debugging and testing**
* ☁️ Support for multiple GCP projects
* 🌐 Multi-region support
* 🔐 Secure credential handling (no credentials are exposed to external services)
* 🏃‍♂️ Local execution with your GCP credentials
* 🔄 Automatic retries for improved reliability

## Cloud Functions Features

This fork adds extensive Cloud Functions support:

- **List Cloud Functions** - View all Cloud Functions in a project/region
- **Get Function Details** - Detailed information about a specific function
- **Log Analysis** - View and filter function logs
- **Error Debugging** - Focus on error logs for quick debugging
- **Function Testing** - Test HTTP-triggered functions with custom payloads
- **Performance Metrics** - View function execution metrics

## Prerequisites

* Node.js
* Claude Desktop/Cursor/Windsurf
* GCP credentials configured locally (application default credentials)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hdbookie/gcp-mcp
cd gcp-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### Claude Desktop

1. Open Claude desktop app and go to Settings -> Developer -> Edit Config

2. Add the following entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gcp": {
      "command": "npm",
      "args": [
        "--silent",
        "--prefix",
        "/path/to/your/gcp-mcp",
        "start"
      ]
    }
  }
}
```

Replace `/path/to/your/gcp-mcp` with the actual path to your project directory.

### Cursor

1. Open Cursor and go to Settings (⌘,)
2. Navigate to AI -> Model Context Protocol
3. Add a new MCP configuration:
```json
{
  "gcp": {
    "command": "npm",
    "args": [
      "--silent",
      "--prefix",
      "/path/to/your/gcp-mcp",
      "start"
    ]
  }
}
```

### Windsurf

1. Open `~/.windsurf/config.json` (create if it doesn't exist)
2. Add the MCP configuration:
```json
{
  "mcpServers": {
    "gcp": {
      "command": "npm",
      "args": [
        "--silent",
        "--prefix",
        "/path/to/your/gcp-mcp",
        "start"
      ]
    }
  }
}
```

### GCP Setup

1. Set up GCP credentials:
   - Set up application default credentials using `gcloud auth application-default login`

2. Ensure you have the necessary IAM permissions for Cloud Functions:
   - `cloudfunctions.functions.get`
   - `cloudfunctions.functions.list`
   - `logging.logEntries.list` (for logs)

3. Refresh your AI assistant (Claude Desktop/Cursor/Windsurf)

## Usage

Start by selecting a project or asking questions like:
* "List all GCP projects I have access to"
* "Show me all Cloud SQL instances in project X"
* "What's my current billing status?"
* "Show me the logs from my Cloud Run services"
* "List all GKE clusters in us-central1"
* "Show me all Cloud Storage buckets in project X"
* "What Cloud Functions are deployed in us-central1?"
* "List all Cloud Run services"
* "Show me BigQuery datasets and tables"

## Cloud Functions Usage Examples

Here are some example prompts to use with the enhanced Cloud Functions support:

```
List all Cloud Functions in my project

Get details for my function named "process-image"

Show me logs from my "auth-handler" function

What errors have occurred in my "payment-processor" function in the last 24 hours?

Test my HTTP function "submit-form" with this payload: {"name": "Test User", "email": "test@example.com"}

What are the performance metrics for my "data-sync" function?
```

You can specify regions explicitly:

```
List all Cloud Functions in europe-west1

Get logs for my "data-processor" function in us-east1
```

## Available Tools

In addition to the standard GCP-MCP tools, this enhanced version includes:

1. `run-gcp-code`: Execute GCP API calls using TypeScript code
2. `list-projects`: List all accessible GCP projects
3. `select-project`: Select a GCP project for subsequent operations
4. `get-billing-info`: Get billing information for the current project
5. `get-cost-forecast`: Get cost forecast for the current project
6. `get-billing-budget`: Get billing budgets for the current project
7. `list-gke-clusters`: List all GKE clusters in the current project
8. `list-sql-instances`: List all Cloud SQL instances in the current project
9. `get-logs`: Get Cloud Logging entries for the current project
10. `list-cloud-functions`: List all Cloud Functions in a region
11. `get-cloud-function-details`: Get detailed information about a specific function
12. `get-cloud-function-logs`: Get logs for a specific function
13. `get-cloud-function-errors`: Get error logs for a specific function
14. `test-http-function`: Test an HTTP-triggered function
15. `get-cloud-function-metrics`: Get execution metrics for a function

## Example Interactions

1. List available projects:
```
List all GCP projects I have access to
```

2. Select a project:
```
Use project my-project-id
```

3. List all Cloud Functions:
```
List all Cloud Functions in my project
```

4. View Cloud Function logs:
```
Show me the logs from my "process-payment" function
```

5. Test a Cloud Function:
```
Test my HTTP function "process-order" with this JSON payload: {"orderId": "12345", "customerId": "customer-123"}
```

## Supported Services

* Google Compute Engine
* Cloud Storage
* **Cloud Functions (Enhanced)**
* Cloud Run
* BigQuery
* Cloud SQL
* Google Kubernetes Engine (GKE)
* Cloud Logging
* Cloud Billing
* Resource Manager
* More coming soon...

## Troubleshooting

To see logs:
```bash
tail -n 50 -f ~/Library/Logs/Claude/mcp-server-gcp.log
```

Common issues:
1. Authentication errors: Ensure you've run `gcloud auth application-default login`
2. Permission errors: Check IAM roles for your account
3. API errors: Verify that required APIs are enabled in your project

Common Cloud Functions issues:
1. **Permission errors**: Ensure your account has the necessary IAM roles
2. **Region mismatches**: Verify the region where your functions are deployed
3. **HTTP testing failures**: Ensure the function accepts HTTP requests and has the proper IAM permissions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT