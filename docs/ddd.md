# Domain Driven Design

a set of principles and patterns that can be applied to any software project

## Entities

- objects that have unique identifier and a life cycle
- mutable and can be modified over time
- have a conceptual identity even if attributes change
- not equal to each other even with same attributes

## ValueObjects

- immutable
- don’t have a unique identifier
- equal to each other if they have the same attributes

## Aggregates

- cluster of objects treated as a single unit
- ensure all of the objects within it are always in a valid and consistent state
- represents a transactional consistency boundary, changes to the objects within it should be made in a single transaction

## Repositories

- persist and retrieve aggregates
- provide an abstraction over the data access layer

## Services

- used to encapsulate domain logic that doesn’t belong to an entity or value object
- Warning! avoid anemic domain model anti pattern where the domain model doesn’t contain domain logic

## Factories

- used to encapsulate the creation of complex objects
- useful when creation of objects involves complex validation, initialization or coordination of multiple steps
- used keep the domain model clean

## Events

- used to communicate and capture domain specific information about actions or domain model changes that have happened in the past
- play a crucial role in enabling loose coupling, scalability and eventual consistency in distributed systems
- distinguish between two types of events
  - domain events
  - integration events
