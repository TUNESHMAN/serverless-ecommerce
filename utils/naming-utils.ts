export interface IConfigProps {
    customName: string;
    appName: string;
    stageName: string;
    serviceName: string;
    region: string;
    accountId: string;
  }

  export class NamingUtils {
    readonly config: IConfigProps;
  
    constructor(config: IConfigProps) {
      this.config = config;
    }
  
    /**
     * Create a resource name based on standard naming convention
     * {code}<customName>-<appName>-<serviceName>-<stageName>-<optional itemSuffix>{code}
     * @param {string} itemSuffix - suffix for service that may have multiple of the same resource (Lambda, DynamoTables etc)
     * @returns generated resource name
     */
    createResourceName (itemSuffix?: string): string {
      if (itemSuffix) {
        return `${this.config.customName}-${this.config.appName}-${this.config.serviceName}-${this.config.stageName}-${itemSuffix}`;
      }
      return `${this.config.customName}-${this.config.appName}-${this.config.serviceName}-${this.config.stageName}`;
    }
  
    /**
     * Create a resource name based on standard naming convention
     * {code}<serviceName>-<stageName>-<optional itemSuffix>{code}
     * @param {string} itemSuffix - suffix for service that may have multiple of the same resource (Lambda, DynamoTables etc)
     * @returns generated resource name
     */
    createLogicalName (itemSuffix: string): string {
      const service = `${this.config.serviceName.charAt(0).toUpperCase()}${this.config.serviceName.slice(1)}`;
      const suffix = `${itemSuffix.charAt(0).toUpperCase()}${itemSuffix.slice(1)}`;
      const name = `${service}${suffix}`;
  
      return name;
    }
  
    createResourceShortName (itemSuffix: string): string {
      return itemSuffix.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
    }
  }
  