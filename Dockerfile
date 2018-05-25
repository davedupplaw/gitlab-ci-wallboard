################
## STEP 1
################
FROM trion/ng-cli
USER root

# Create app directory
WORKDIR /app

# Copy the files needed to build the bundle
COPY . ./

# Build
RUN npm i npm@latest -g
RUN cd frontend && npm install && ng build
RUN cd backend && npm install && npm run build

################
## STEP 2
################
# - the two step approach halves the docker image size
#   because we no longer need the build tools

FROM mhart/alpine-node:base

# Create app directory
WORKDIR /app

# Copy the files needed to run the system only
COPY --from=0 /app/backend/build ./
COPY --from=0 /app/backend/node_modules ./node_modules/

# Start the app
ENV NODE_ENV=production
EXPOSE 3000
CMD [ "node", "compiled.js" ]
