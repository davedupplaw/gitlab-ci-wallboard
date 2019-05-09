import * as fs from 'fs';
import {Configuration, FrontEndConfiguration} from '../../../shared/domain/config/Configuration';
import {GitLabConfiguration} from '../../../shared/domain/config/GitLabConfiguration';
import {StringUtils} from './StringUtils';

export class ConfigurationManager {
    private readonly config: Configuration;

    constructor() {
        const configName = process.env.profile || 'config';
        this.config = JSON.parse(fs.readFileSync(`config/${configName}.json`, 'utf-8'));

        ConfigurationManager.updateConfigurationFromEnvironment(this.config);
        ConfigurationManager.updateFrontendConfigurationFromEnvironment(this.config.frontend);
        ConfigurationManager.updateGitlabConfigurationFromEnvironment(this.config.scm.gitlab);

        console.log('Using the following configuration:');
        console.log(this.config);
    }

    private static updateConfigurationFromEnvironment(config: Configuration): Configuration {
        config.port = StringUtils.parseInteger(process.env.GCIWB_PORT, config.port);
        config.wallboard_url = process.env.GCIWB_WALLBOARD_URL || config.wallboard_url;
        return config;
    }

    private static updateFrontendConfigurationFromEnvironment(config: FrontEndConfiguration): FrontEndConfiguration {
        config.showProjectsWithoutBuilds = StringUtils.tf(process.env.GCIWB_INCLUDE_NO_BUILDS, config.showProjectsWithoutBuilds);
        config.showSemanticsCard = StringUtils.tf(process.env.GCIWB_SHOW_SEMANTICS, config.showSemanticsCard);
        return config;
    }

    private static updateGitlabConfigurationFromEnvironment(gitlab: GitLabConfiguration): GitLabConfiguration {
        gitlab.host = process.env.GITLAB_HOST || 'gitlab.com';
        gitlab.token = process.env.GITLAB_TOKEN;

        gitlab.whitelist.projects = StringUtils.parseWhitelist(process.env.GCIWB_PROJECTS);
        gitlab.whitelist.groups = StringUtils.parseWhitelist(process.env.GCIWB_GROUPS);
        gitlab.whitelist.users = StringUtils.parseWhitelist(process.env.GCIWB_USERS);

        return gitlab;
    }

    public getConfiguration(): Configuration {
        return this.config;
    }
}
