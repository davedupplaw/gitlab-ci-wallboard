import * as fs from 'fs';
import {Configuration} from '../../../shared/domain/Configuration';

export class ConfigurationManager {
    private readonly config: Configuration;

    constructor() {
        const configName = process.env.profile || 'config';
        this.config = JSON.parse(fs.readFileSync(`config/${configName}.json`, 'utf-8'));
    }

    getConfiguration(): Configuration {
        return this.config;
    }
}
