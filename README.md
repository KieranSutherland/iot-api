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

### Device specification

The device entity represents a physical IoT device and contains identifying, connectivity, and runtime state information.

- **name**: string - Human-friendly device name (e.g. "Smart light").
- **type**: string - Device type (e.g. `light`, `thermostat`, `moisture_sensor`).
- **status**: string - Runtime status (e.g. `online`, `offline`, `maintenance`).
- **firmwareVersion**: string - Firmware/software version running on the device.
- **location**: string - Optional textual location (e.g. `kitchen`).
- **connectivity**: object - Network/connectivity details:
	- **protocol**: string - e.g. `http`, `mqtt`.
	- **ipAddress**: string - IPv4/IPv6 address of the device (when applicable).
	- **macAddress**: string - MAC address of the device network interface.
- **state**: object - Device-specific runtime state (keys depend on device type). Example for a light:
	- **light**: string - e.g. `on`/`off`.
	- **brightness**: string - e.g. `85%` or numeric value.
- **description**: string - Optional description of the device.
- **metadata**: object - Arbitrary key/value data (e.g. battery level, vendor data).

Below is an example of creating a device using the REST API. Replace `{tenantId}` with the tenant identifier.

```bash
curl -X POST http://localhost:3000/api/v1/{tenantId}/devices \
	-H "Content-Type: application/json" \
	-d '{
		"name": "Smart light",
		"type": "light",
		"status": "online",
		"firmwareVersion": "24.5",
		"location": "kitchen",
		"connectivity": {
			"protocol": "http",
			"ipAddress": "192.168.1.1",
			"macAddress": "00:1A:2B:3C:4D:5E"
		},
		"state": {
			"light": "off",
			"brightness": "85%"
		},
		"description": "RGB light",
		"metadata": {
			"battery": "90%"
		}
	}'
```

Successful response: HTTP `201` with the created device object including server-assigned fields such as `id`, `createdAt`, and `updatedAt`.

For the complete device type definition and all fields returned by the API, see the device index: [packages/iot-api/src/device/index.ts](packages/iot-api/src/device/index.ts)



## Running locally

### Prerequisites

You must have the docker engine installed and the daemon running.

This can either be through [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) if you have a license, or through [Docker Engine](https://docs.docker.com/engine/install) on Linux for free.

### Build the Docker image and start the container

Run the following command in the root of this project to start the service:
`docker compose up --build`

The REST endpoints will then be available on `http://localhost:3000`.

The frontend will be available on `http://localhost:5173`.

If either of these ports do not work, check the container logs in case they routed to different ports.

## Further improvements if I had more time

- Required authentication for REST requests. Each requester should have an auth token designating what they are allowed to request. Including which tenants they have access to and what operations they are allowed to execute on the devices e.g. read-only would be only the GET requests.
- Integration tests for dynamodb and lambda
- Multi-device selection in one query
- Separate device state and device information upserting into separate endpoints to more easily permit for admin users vs tenant users.
- Make all frontend text translatable