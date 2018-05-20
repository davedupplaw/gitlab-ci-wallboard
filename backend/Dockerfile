################
## STEP 1
################
FROM mhart/alpine-node

# Create app directory
WORKDIR /app

# Copy the files needed to build the bundle
COPY . ./

# Build
RUN npm install
RUN npm run build

################
## STEP 2
################
# - the two step approach halves the docker image size
#   because we no longer need npm and its dependencies

FROM mhart/alpine-node:base

# Create app directory
WORKDIR /app

COPY --from=0 /app/build ./
COPY --from=0 /app/node_modules ./node_modules/

# Start the app
EXPOSE 3000
CMD [ "node", "compiled.js" ]
