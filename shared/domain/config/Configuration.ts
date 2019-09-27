import {GitLabConfiguration} from './GitLabConfiguration';

export class FrontEndConfiguration {
    public showProjectsWithoutBuilds: boolean;
    public showSemanticsCard: boolean;
    public baseUrl: string;
}

export class SCMConfig {
    public usePolling: boolean;
    public pollingConfiguration: PollingConfiguration;
    public gitlab?: GitLabConfiguration;
}

export class PollingConfiguration {
    public projectUpdatePeriod: number;
    public buildUpdatePeriod: number;
    public commitSummaryUpdatePeriod: number;
    public randomiseTime: boolean;
    public randomTimePortion: number;
}

export class Configuration {
    public port: number;
    public wallboardUrl: string;
    public scm: SCMConfig;
    public frontend: FrontEndConfiguration;
}
