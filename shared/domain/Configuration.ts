import {GitLabConfiguration} from './GitLabConfiguration';

export class FrontEndConfiguration {
    public showProjectsWithoutBuilds: boolean;
    public showSemanticsCard: boolean;
}

export class SCMConfig {
    public projectUpdatePeriod: number;
    public buildUpdatePeriod: number;
    public gitlab?: GitLabConfiguration;
}

export class Configuration {
    public port: number;
    public scm: SCMConfig;
    public frontend: FrontEndConfiguration;
}
