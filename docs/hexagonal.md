# Hexagonal Architecture

This architecture revolves around the idea of dependency inversion, which means that high level modules such as the core module should not depend on low level modules, such as thos external concerns. Instead, both should depend on abstractions known as ports. This inversion of dependencies enables the core to remain independent and isolated from external systems, making it easier to test, maintain, and adpat the application.

Some benefits of hexagonal architecture are:

- Decoupling. This architecture promotes loose coupling between the core domain and external concerns, allowing changes to occur in one area without affecting others.
- Testability. By defining clear interfaces or ports for interactions, it becomes easier to test the core domain in isolation without relying on external systems.
- Flexibility. Hexagonal architecture allows for the replacement or modification of external concerns or adapters without impacting the core domain, making it more adaptable to different technology stacks.
- Isolation of Core Domain. The core domain is the focal point of the application, enabling developers to focus on expressing business logic without being influenced by external factors.
- Domain Centric Design. This architectural pattern encourages a strong focus on the core domain and the business rules, leading to a more expressive and maintainable domain model.

In traditional three tier architecture with controller, services (business logic) and data access layers, flow of control is from controller to services (business logic) to data access layers. If we invert the dependency between the business logic and the data access layers, the business logic layer will still interact with the data access layer, but it will do so through an interface or port. This is the core idea behind hexagonal architecure. The business logic layer is isolated from the data access layer and vice versa. The business logic layer defines the interface or port, and the data access layer implements it as it is our adapter.

Hexagonal architecture focuses on a strong separation of concerns, dependency inversion, and clear interfaces known as ports for interactions. It promotes a domain centric design and provides better testability and flexibility. On the other hand three tier architecture relies on horizontal layering but might not achieve the same level of isolation and testability as hexagonal architecture

## Ports

Interfaces that represent the entry points into the core application. They define the contract for interactions with the external world and represent the applications, use cases and boundaries. The Core domain exposes these ports, allowing external concerns to interact with the application in a standardized way.

## Adapters

Adapapters implement the interfaces (or ports) defined by the core domain. They serve as the bridge between the core application and the external concerns. Adapters are responsible for translating the language of the core domain into something that external systems can understand, such as data persistence mechanisms, APIs, or user interfaces.

## Nest.js implentation of hexagonal architecture suggestion

### Application folder

Contains the application controllers, services, facades, handlers. it communicates with data access components, message Brokers and other External systems through "interface" called ports.

### Domain Folder

Contains the domain models, value objects, domain events

### Infrastructure folder

Contains the data access components, message brokers and other external systems. it will implement the interfaces (aka ports) defined by the application layer
