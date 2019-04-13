# GitLab CI Monitor

A dashboard for monitoring [GitLab CI][gitlab-ci] builds.
Based on the code [here][original-github] which used a front-end only
VueJS app, this has been reworked into an Angular 7 Typescript app with
a Typescript nodeJS backend. This allows it to be dockerised and contained
to one GitLab, with one set of projects and without passing a personal
access token over the URL.

The current functionality is that it reads a list of projects from the Git server
using the Personal Access Token provided. For those with build information,
it shows them on the page coloured green for success, or red for failure.  It shows
the last committer, when the last commit was made and on what branch that occurred.

The page currently updates via a websocket, and the backend will check
GitLab every 120 seconds for new projects and every 10 seconds for
builds information. Builds are are ordered by name, but failed and
building projects come first.

This is how it looks:

![Example][example]

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

### Configuration

Here are the configuration options that can be passed in the environment:

| Option        | Description                                  |
| ------------- | -------------------------------------------- |
| GITLAB_HOST   | Which GitLab server to get information from  |
| GITLAB_TOKEN  | The Personal Access Token to use to get information |
| GCIWB_GROUPS  | The groups to use to get projects from (csv) (mutually exclusive with GCIWB_USERS) |
| GCIWB_USERS   | The users to use get projects from (csv) (mutually exclusive with GCIWB_GROUPS) |
| GCIWB_PROJECTS | The list of projects to use (csv) |
| GCIWB_INCLUDE_NO_BUILDS | Whether to include projects without a build |
| GCIWB_SHOW_SEMANTICS | Whether to show the semantic commit summary card |

## Development

To run the front-end only, run:
```
ng serve
```
Angular server runs on port 4200 by default.

Alternatively, build the frontend which places it in a directory to be
served by the backend, then run the backend.  You can build the frontend
on a watch:
```
ng build --watch
```

Then, to run the backend, run in different shells:
```
npm run dev
npm run watch
```
which runs the compilation of the server and then the hot reloading for
when the bundle changes.  

The backend listens on port 3000.

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

See the [Trello Board][trello]

[gitlab-ci]: https://about.gitlab.com/gitlab-ci/
[original-github]: https://github.com/TheoTsatsos/gitlab-ci-wallboard
[trello]: https://trello.com/b/v667U5fY/gitlab-ci-wallboard
[example]: gitlab-ci-wallboard-example.png
