#!/usr/bin/env sh

# Synopsis:
# Test the representer Docker image by running it against a predefined set of 
# solutions with an expected output.
# The representer Docker image is built automatically.

# Output:
# Outputs the diff of the expected representation and mapping against the
# actual representation and mapping generated by the representer.

# Example:
# ./bin/run-tests-in-docker.sh

# Build the Docker image
docker build --rm -t exercism/wren-representer .

# Run the Docker image using the settings mimicking the production environment
docker run \
    --rm \
    --network none \
    --read-only \
    --mount type=bind,source="${PWD}/test",destination=/opt/representer/test \
    --mount type=tmpfs,destination=/tmp \
    --volume "${PWD}/bin/run-tests.sh:/opt/representer/bin/run-tests.sh" \
    --workdir /opt/representer \
    --entrypoint /opt/representer/bin/run-tests.sh \
    exercism/wren-representer
