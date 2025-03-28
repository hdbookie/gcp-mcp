import { 
  CloudFunctionsServiceClient
} from '@google-cloud/functions';
import { 
  Logging
} from '@google-cloud/logging';

/**
 * Cloud Functions Manager for GCP MCP Server
 * 
 * Provides capabilities to:
 * - List Cloud Functions
 * - Get Cloud Function details
 * - Get Cloud Function source code
 * - Get Cloud Function logs
 * - Debug Cloud Functions
 */
export class CloudFunctionsManager {
  private client: CloudFunctionsServiceClient;
  private loggingClient: Logging;
  private projectId: string;
  private region: string;

  constructor(projectId: string, region: string = 'us-central1') {
    this.client = new CloudFunctionsServiceClient();
    this.loggingClient = new Logging();
    this.projectId = projectId;
    this.region = region;
  }

  /**
   * List all Cloud Functions in the project and region
   */
  async listFunctions() {
    try {
      const parent = `projects/${this.projectId}/locations/${this.region}`;
      const request = {
        parent,
      };

      const [functions] = await this.client.listFunctions(request);
      
      return functions.map((func) => {
        // Extract the function name from the full path
        const nameComponents = func.name?.split('/') || [];
        const functionName = nameComponents[nameComponents.length - 1];
        
        return {
          name: functionName,
          status: func.status,
          entryPoint: func.entryPoint,
          runtime: func.runtime,
          timeout: func.timeout,
          availableMemoryMb: func.availableMemoryMb,
          serviceAccountEmail: func.serviceAccountEmail,
          updateTime: func.updateTime,
          versionId: func.versionId,
          environmentVariables: func.environmentVariables,
          buildId: func.buildId,
          ingressSettings: func.ingressSettings,
          uri: func.httpsTrigger?.url,
          eventTrigger: func.eventTrigger ? {
            eventType: func.eventTrigger.eventType,
            resource: func.eventTrigger.resource,
            service: func.eventTrigger.service,
          } : undefined,
        };
      });
    } catch (error) {
      console.error('Error listing functions:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific Cloud Function
   */
  async getFunctionDetails(functionName: string) {
    try {
      const name = `projects/${this.projectId}/locations/${this.region}/functions/${functionName}`;
      const [functionDetails] = await this.client.getFunction({ name });
      
      return {
        name: functionName,
        status: functionDetails.status,
        entryPoint: functionDetails.entryPoint,
        runtime: functionDetails.runtime,
        timeout: functionDetails.timeout,
        availableMemoryMb: functionDetails.availableMemoryMb,
        serviceAccountEmail: functionDetails.serviceAccountEmail,
        updateTime: functionDetails.updateTime,
        versionId: functionDetails.versionId,
        environmentVariables: functionDetails.environmentVariables,
        buildId: functionDetails.buildId,
        ingressSettings: functionDetails.ingressSettings,
        uri: functionDetails.httpsTrigger?.url,
        eventTrigger: functionDetails.eventTrigger ? {
          eventType: functionDetails.eventTrigger.eventType,
          resource: functionDetails.eventTrigger.resource,
          service: functionDetails.eventTrigger.service,
        } : undefined
      };
    } catch (error) {
      console.error(`Error getting function ${functionName} details:`, error);
      throw error;
    }
  }

  /**
   * Get source code for a specific Cloud Function
   */
  async getFunctionSource(functionName: string) {
    try {
      const name = `projects/${this.projectId}/locations/${this.region}/functions/${functionName}`;
      
      // Get function details first to check the source repository
      const [functionDetails] = await this.client.getFunction({ name });
      
      // If the function uses a repository, provide repository info
      if (functionDetails.sourceRepository) {
        return {
          type: 'repository',
          url: functionDetails.sourceRepository.url,
          deployedUrl: functionDetails.sourceRepository.deployedUrl
        };
      }
      
      // If the function uses a storage bucket, provide bucket info
      if (functionDetails.sourceArchiveUrl) {
        return {
          type: 'archive',
          sourceArchiveUrl: functionDetails.sourceArchiveUrl,
        };
      }

      // Try to get the actual source code if available
      try {
        const [source] = await this.client.generateDownloadUrl({ name });
        return {
          type: 'download',
          downloadUrl: source.downloadUrl,
        };
      } catch (sourceError) {
        console.error(`Could not get direct source for ${functionName}:`, sourceError);
        return {
          type: 'unavailable',
          message: 'Source code retrieval is unavailable for this function. Check deployment method.',
          function: functionDetails.name,
        };
      }
    } catch (error) {
      console.error(`Error getting function ${functionName} source:`, error);
      throw error;
    }
  }

  /**
   * Get logs for a specific Cloud Function
   */
  async getFunctionLogs(functionName: string, limit: number = 50) {
    try {
      const log = this.loggingClient.log(`cloudfunctions.googleapis.com/cloud-functions`);
      
      const [entries] = await log.getEntries({
        filter: `resource.labels.function_name="${functionName}" AND resource.type="cloud_function"`,
        orderBy: 'timestamp desc',
        pageSize: limit,
      });
      
      return entries.map((entry) => {
        const timestamp = typeof entry.metadata?.timestamp === 'object' 
          ? (entry.metadata.timestamp.toString ? entry.metadata.timestamp.toString() : '') 
          : entry.metadata?.timestamp || '';
        
        const severity = entry.metadata?.severity || '';
        
        // Handle different payload types
        let message = '';
        if (typeof entry.data === 'string') {
          message = entry.data;
        } else if (typeof entry.data === 'object') {
          if (entry.data.message) {
            message = entry.data.message;
          } else {
            message = JSON.stringify(entry.data);
          }
        }
        
        return {
          timestamp,
          severity,
          message,
          // Include trace ID if available for debugging distributed systems
          trace: entry.metadata?.trace || '',
        };
      });
    } catch (error) {
      console.error(`Error getting logs for function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Test a HTTP-triggered Cloud Function by sending a request
   */
  async testHttpFunction(functionName: string, payload: any = {}) {
    try {
      // First get the function details to get the URL
      const details = await this.getFunctionDetails(functionName);
      
      if (!details.uri) {
        throw new Error(`Function ${functionName} does not have an HTTP URL. It might not be an HTTP-triggered function.`);
      }
      
      // Use node-fetch to make the HTTP request
      const response = await fetch(details.uri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const statusCode = response.status;
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }
      
      return {
        statusCode,
        response: responseData,
      };
    } catch (error) {
      console.error(`Error testing HTTP function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get recent errors from a Cloud Function
   */
  async getFunctionErrors(functionName: string, limit: number = 10) {
    try {
      const log = this.loggingClient.log(`cloudfunctions.googleapis.com/cloud-functions`);
      
      const [entries] = await log.getEntries({
        filter: `resource.labels.function_name="${functionName}" AND resource.type="cloud_function" AND severity>=ERROR`,
        orderBy: 'timestamp desc',
        pageSize: limit,
      });
      
      return entries.map((entry) => {
        const timestamp = typeof entry.metadata?.timestamp === 'object' 
          ? (entry.metadata.timestamp.toString ? entry.metadata.timestamp.toString() : '') 
          : entry.metadata?.timestamp || '';
          
        const severity = entry.metadata?.severity || '';
        
        // Handle different payload types
        let message = '';
        let stack = '';
        
        if (typeof entry.data === 'string') {
          message = entry.data;
        } else if (typeof entry.data === 'object') {
          if (entry.data.message) {
            message = entry.data.message;
          }
          if (entry.data.stack) {
            stack = entry.data.stack;
          } else {
            message = JSON.stringify(entry.data);
          }
        }
        
        return {
          timestamp,
          severity,
          message,
          stack,
          // Include trace ID if available for debugging distributed systems
          trace: entry.metadata?.trace || '',
        };
      });
    } catch (error) {
      console.error(`Error getting errors for function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Get metrics for a Cloud Function (execution count, errors, latency)
   */
  async getFunctionMetrics(functionName: string, hours: number = 24) {
    try {
      // This would typically use Cloud Monitoring API
      // For simplicity, we're just counting error and success logs
      const log = this.loggingClient.log(`cloudfunctions.googleapis.com/cloud-functions`);
      
      // Calculate time range
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      
      // Get error logs
      const [errorEntries] = await log.getEntries({
        filter: `resource.labels.function_name="${functionName}" AND resource.type="cloud_function" AND severity>=ERROR AND timestamp>="${startTime.toISOString()}"`,
      });
      
      // Get all logs
      const [allEntries] = await log.getEntries({
        filter: `resource.labels.function_name="${functionName}" AND resource.type="cloud_function" AND timestamp>="${startTime.toISOString()}"`,
      });
      
      return {
        totalExecutions: allEntries.length,
        totalErrors: errorEntries.length,
        successRate: allEntries.length ? (1 - errorEntries.length / allEntries.length) * 100 : 100,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          hours,
        }
      };
    } catch (error) {
      console.error(`Error getting metrics for function ${functionName}:`, error);
      throw error;
    }
  }
}