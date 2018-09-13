import ProjectCache from "./ProjectCache";

class ProjectCacheFactory {
    private _cache: ProjectCache = new ProjectCache();

    getCache() {
        return this._cache;
    }
}

export default new ProjectCacheFactory();