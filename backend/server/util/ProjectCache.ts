import Project from '../../../shared/domain/Project';

interface Map<T> {
    [key: string]: T;
}

export default class ProjectCache {
    private _cache: Map<Project> = {};

    public getProject(key: string) {
        return this._cache[key];
    }

    public update(project: Project) {
        if (project && project.id) {
            if (this._cache[project.id]) {
                this._cache[project.id] = { ...this._cache[project.id], ...project };
            } else {
                this._cache[project.id] = project;
            }
        } else {
            console.warn('ProjectCache: Ignored project: ', project);
        }
    }

    public getProjects() {
        return Object.keys(this._cache).map(k => this._cache[k]);
    }
}
