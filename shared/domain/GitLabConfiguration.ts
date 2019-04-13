export class GitLabConfiguration {
    public host: string;
    public token: string;
    public whitelist?: {
        projects: string[],
        users: string[],
        groups: string[]
    };
}
