export class FrontEndConfiguration {
    public showProjectsWithoutBuilds: boolean;
    public showSemanticsCard: boolean;
}

export class SCMConfig {
    public projectUpdatePeriod: number;
    public buildUpdatePeriod: number;
}

export class Configuration {
    public port: number;
    public scm: SCMConfig;
    public frontend: FrontEndConfiguration;
}
