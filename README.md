# GitLab CI Monitor

A dashboard for monitoring [GitLab CI][gitlab-ci] builds.
Based on the code [here][original-github] which used a front-end only
VueJS app, this has been reworked into an Angular 6 Typescript app with
a Typescript nodeJS backend. This allows it to be dockerised and contained
to one GitLab, with one set of projects and without passing a personal
access token over the URL.

[gitlab-ci]: https://about.gitlab.com/gitlab-ci/
[original-github]: https://github.com/TheoTsatsos/gitlab-ci-wallboard

This is how it looks:

![Example][example]

[example]: gitlab-ci-monitor-example.png

## Usage

## Development

To run the backend, in different shells run:
```
npm run dev
npm run watch
```
which runs the compilation of the server and then the hot reloading for
when the bundle changes.

To run the front-end, run:
```
ng serve
```

## License

The original GitLab CI Monitor is licensed under the 
[MIT license](frontend/LICENSE) and so you will find that 
original license within the front-end code. Even though the code is 
now very different it was originally forked from that repo so the
license remains.

The backend code is my own work and is also licensed under the
[MIT license](backend/LICENCE).
