################
## STEP 1
################

FROM mhart/alpine-node

# Create app directory
WORKDIR /app

# Copy the package.json so we can install the dependencies
COPY package*.json ./

# Install only runtime dependencies
RUN npm install --only=production

################
## STEP 2
################
# - the two step approach halves the docker image size
#   because we no longer need npm and its dependencies

FROM mhart/alpine-node:base

# Create app directory
WORKDIR /app

# Copy the views so we can render something
# (these are first as they're least likely to change)
COPY server/views ./server/views

COPY --from=0 /app .

# Bundle compiled server into image with config
COPY config .
COPY build .

# Start the app
EXPOSE 3000
CMD [ "node", "compiled.js" ]
