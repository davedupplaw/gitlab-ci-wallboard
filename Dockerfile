################
## STEP 1
################
FROM trion/ng-cli

# Create app directory
WORKDIR /app

# Copy the files needed to build the bundle
COPY --chown=1000:1000 . ./

# Build
RUN cd frontend && npm install && ng build
RUN cd backend && npm install && npm run build

################
## STEP 2
################
# - the two step approach halves the docker image size
#   because we no longer need the build tools

FROM mhart/alpine-node:base

# We're going to run the server under user node
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# Create app directory
WORKDIR /app

# Copy the files needed to run the system only
COPY --chown=node:node --from=0 /app/backend/build ./
COPY --chown=node:node --from=0 /home/node/node_modules ./node_modules/

# Start the app
USER node
EXPOSE 3000
CMD [ "node", "compiled.js" ]
