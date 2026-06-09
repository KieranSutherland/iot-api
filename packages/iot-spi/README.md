# SPI

This package defines the Service Provider Interface (SPI) for the service.

The SPI is an internal set of types that are used to abstract over vendor specific technologies and to ensure that the
core business logic remains independent of such technologies.

Unlike the API, this package is not intended to be published externally, and its types are relevant only when
implementing core business logic and vendor specific implementations of the interfaces defined in this package.
