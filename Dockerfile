# node:24.18.0-alpine3.24 == lts-alpine
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS builder

# Install SSL ca certificates
RUN apk update && apk add ca-certificates

# Create appuser
RUN adduser -D -g '' appuser

# get the source code
WORKDIR /wren-representer
COPY package.json .
COPY yarn.lock .

# Install without arguments runs yarn prepublish
RUN yarn install

# Only install the node_modules we need
RUN yarn install --production --modules-folder './production_node_modules'

COPY . .

# Build a minimal and secured container
FROM node:24.18.0-alpine3.24@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /wren-representer/package.json /opt/representer/package.json
COPY --from=builder /wren-representer/bin /opt/representer/bin
COPY --from=builder /wren-representer/src /opt/representer/src
# COPY --from=builder /wren-representer/dist /opt/representer/dist
COPY --from=builder /wren-representer/production_node_modules /opt/representer/node_modules
USER appuser
WORKDIR /opt/representer
ENTRYPOINT ["/opt/representer/bin/run.sh"]
