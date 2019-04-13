import * as fs from 'fs';
import {Configuration, FrontEndConfiguration} from '../../../shared/domain/Configuration';
import {GitLabConfiguration} from '../../../shared/domain/GitLabConfiguration';
import {StringUtils} from './StringUtils';

export class ConfigurationManager {
    private readonly config: Configuration;

    constructor() {
        const configName = process.env.profile || 'config';
        this.config = JSON.parse(fs.readFileSync(`config/${configName}.json`, 'utf-8'));

        this.updateFrontendConfigurationFromEnvironment(this.config.frontend);
        this.updateGitlabConfigurationFromEnvironment(this.config.scm.gitlab);

        console.log('Using the following configuration:');
        console.log(this.config);
    }

    public getConfiguration(): Configuration {
        return this.config;
    }

    private updateFrontendConfigurationFromEnvironment(config: FrontEndConfiguration) {
        config.showProjectsWithoutBuilds = this.tf(process.env.GCIWB_INCLUDE_NO_BUILDS, config.showProjectsWithoutBuilds);
        config.showSemanticsCard = this.tf(process.env.GCIWB_SHOW_SEMANTICS, config.showSemanticsCard);
        return config;
    }

    private updateGitlabConfigurationFromEnvironment(gitlab: GitLabConfiguration) {
        gitlab.host = process.env.GITLAB_HOST || 'gitlab.com';
        gitlab.token = process.env.GITLAB_TOKEN;

        gitlab.whitelist.projects = this.parseWhitelist(process.env.GCIWB_PROJECTS);
        gitlab.whitelist.groups = this.parseWhitelist(process.env.GCIWB_GROUPS);
        gitlab.whitelist.users = this.parseWhitelist(process.env.GCIWB_USERS) || ['davedupplaw'];
    }

    private parseWhitelist(whitelistString: string) {
        const arrayOfStuff = StringUtils.parseCSV(whitelistString);
        return arrayOfStuff.length === 0 ? null : arrayOfStuff;
    }

    private tf(string: string, defaultValue: boolean) {
        return string ? string === 'true' : defaultValue;
    }
}
