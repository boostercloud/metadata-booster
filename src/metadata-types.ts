/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyType = { new (...args: any[]): any }

export enum TypeOf {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Enum = 'Enum',
  Union = 'Union',
  Intersection = 'Intersection',
  Function = 'Function',
  Class = 'Class',
  Array = 'Array',
  Object = 'Object',
  Other = 'Other',
}
export interface TypeMetadata {
  name: string
  type: AnyType
  typeOf: TypeOf
  parameters: Array<TypeMetadata>
  isNullable: boolean
}

export interface PropertyMetadata {
  name: string
  typeInfo: TypeMetadata
}

export interface ClassMetadata {
  name: string
  type: AnyType
  fields: Array<PropertyMetadata>
  methods: Array<PropertyMetadata>
}
