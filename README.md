# IoT Device Management REST API

This provides a REST API for managing IoT devices.

## Packages

This project is implemented across various packages, including:

Published packages:

* `api` - the API types for the REST API.

Internal packages:

* `core` - the core package implementing the main logic.
* `rest` - the REST schema for the API.
* `lambda` - the deployment package, implementing AWS specific logic.
* `spi` - the internal interfaces used to communicate between the core package and the implementation-specific packages.
* `storage-dynamodb` - the storage model using Amazon DynamoDB.

## REST API

This project has the following REST endpoints. Note that all endpoints require the tenant ID that the device is (or will be) assigned.

List all devices:
`GET` `/api/v1/{tenantId}/devices`

Create a new device:
`POST` `/api/v1/{tenantId}/devices`

Get specific device:
`GET` `/api/v1/{tenantId}/devices/{id}`

Update specific device:
`PATCH` `/api/v1/{tenantId}/devices/{id}`

Delete specific device:
`DELETE` `/api/v1/{tenantId}/devices/{id}`


## Running locally

### Prerequisites

You must have the docker engine installed and the daemon running.

This can either be through [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) if you have a license, or through [Docker Engine](https://docs.docker.com/engine/install) on Linux.

### Build the Docker image and start the container

Run the following command in the root of this project to start the service:
`docker compose up --build`

The REST endpoints will then be available on `http://localhost:3000`.

## Further improvements if I had more time

- Required authentication for REST requests. Each requester should have an auth token designating what they are allowed to request. Including which tenants they have access to and what operations they are allowed to execute on the devices e.g. read-only would be only the GET requests.
- Integration tests for dynamodb and lambda
- Multi-device selection in one query
- Separate device state and device information upserting into separate endpoints to more easily permit for admin users vs tenant users.