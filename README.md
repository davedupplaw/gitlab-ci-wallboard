# GitLab CI Monitor

A dashboard for monitoring [GitLab CI][gitlab-ci] builds.
Based on the code [here][original-github] which used a front-end only
VueJS app, this has been reworked into an Angular 6 Typescript app with
a Typescript nodeJS backend. This allows it to be dockerised and contained
to one GitLab, with one set of projects and without passing a personal
access token over the URL.

[gitlab-ci]: https://about.gitlab.com/gitlab-ci/
[original-github]: https://github.com/TheoTsatsos/gitlab-ci-wallboard

The current functionality is that it reads a list of projects from the Git server
using the Personal Access Token provided. For those with build information,
it shows them on the page coloured green for success, or red for failure.  It shows
the last committer, when the last commit was made and on what branch that occurred.

The page currently updates every 60 seconds and builds are ordered by name.

This is how it looks:

![Example][example]

[example]: gitlab-ci-monitor-example.png

## Usage

The node server takes the GitLab host and GitLab token from its environment.
The variables `GITLAB_HOST` and `GITLAB_TOKEN` are used to pass these to
the node server.

If you're running from the source use:

```
GITLAB_HOST=gitlab.com GITLAB_TOKEN=12345 node compiled.js
```

However, you can also run it using a docker container:

```
docker run -d -p 3000:3000 \
           -e GITLAB_HOST=gitlab.com \
           -e GITLAB_TOKEN=12345 \
           davedupplaw/gitlab-ci-wallboard
```

## Development

To run the front-end only, run:
```
ng serve
```
Angular server runs on port 4200 by default.

Alternatively, build the backend which places it in a directory to be
served by the backend, then run the backend.

To run the backend, run in different shells:
```
npm run dev
npm run watch
```
which runs the compilation of the server and then the hot reloading for
when the bundle changes.  The backend listens on port 3000.

### Building Docker Image

To build the docker image:

```
docker build -t gitlab-ci-wallboard .
```

This will build the front and back end systems and then create a
docker image containing the code.

## License

The original GitLab CI Monitor is licensed under the 
[MIT license](frontend/LICENSE) and so you will find that 
original license within the front-end code. Even though the code is 
now very different it was originally forked from that repo so the
license remains.

The backend code is my own work and is also licensed under the
[MIT license](backend/LICENCE).

## Intended Extensions

* Order by name and build status (so red builds come first)
* Project/Group black/white list (maybe you don't want to see all)
* Report on semantic commit frequencies (chores vs features)
* Report on committer frequency (who's doing most work)
* Report breakages as a percentage of commits (who's breaking the builds most)
* Audio alerts on broken build
