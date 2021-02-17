export interface TypeInfo {
  name: string
  parameters: Array<TypeInfo>
}

export interface PropertyInfo {
  name: string
  isMethod: boolean
  typeInfo: TypeInfo
}

export interface ClassInfo {
  name: string
  fields: Array<PropertyInfo>
  methods: Array<PropertyInfo>
}
