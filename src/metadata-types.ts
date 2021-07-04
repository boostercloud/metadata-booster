/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyType = { new (...args: any[]): any }

export interface TypeMetadata {
    name: string
    type: AnyType
    isArray: boolean
    parameters: Array<TypeMetadata>
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
