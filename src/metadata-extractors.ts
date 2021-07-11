import { createWrappedNode, SyntaxKind, Type } from 'ts-morph'
import * as ts from 'typescript'
import { TypeOf } from './metadata-types'

export interface TypeInfo {
  name: string
  baseName: string
  parameters: Array<TypeInfo>
  typeOf: TypeOf
  isNullable: boolean
}

export interface PropertyInfo {
  name: string
  typeInfo: TypeInfo
}

export interface ClassInfo {
  name: string
  fields: Array<PropertyInfo>
  methods: Array<PropertyInfo>
}

export function getClassInfo(classNode: ts.ClassDeclaration & ts.Node, checker: ts.TypeChecker): ClassInfo | undefined {
  if (!classNode.name) return

  const node = createWrappedNode<ts.Node>(classNode, { typeChecker: checker }).asKindOrThrow(
    SyntaxKind.ClassDeclaration
  )

  return {
    name: node.getNameOrThrow(),
    fields: node.getInstanceProperties().map((p) => ({ name: p.getName(), typeInfo: getTypeInfo(p.getType()) })),
    methods: node.getInstanceMethods().map((m) => ({ name: m.getName(), typeInfo: getTypeInfo(m.getReturnType()) })),
  }
}

function getTypeInfo(type: Type): TypeInfo {
  const typeOfTuples: [(t: Type) => boolean, TypeOf][] = [
    [(t) => t.isString(), TypeOf.String],
    [(t) => t.isNumber(), TypeOf.Number],
    [(t) => t.isBoolean(), TypeOf.Boolean],
    [(t) => t.isEnum(), TypeOf.Enum],
    [(t) => t.isUnion(), TypeOf.Union],
    [(t) => t.isIntersection(), TypeOf.Intersection],
    [(t) => t.isClass(), TypeOf.Class],
    [(t) => t.isArray(), TypeOf.Array],
    [(t) => t.getCallSignatures().length > 0, TypeOf.Function],
    [(t) => t.isObject(), TypeOf.Object],
  ]
  const isNullable = type.isNullable()
  type = type.getNonNullableType()
  const typeInfo: TypeInfo = {
    name: type.getText(),
    baseName: '',
    typeOf: typeOfTuples.find(([fn]) => fn(type))?.[1] || TypeOf.Other,
    isNullable: isNullable,
    parameters: [],
  }
  switch (typeInfo.typeOf) {
    case TypeOf.Enum:
    case TypeOf.Union:
      typeInfo.parameters = type.getUnionTypes().map((t) => getTypeInfo(t))
      break
    case TypeOf.Intersection:
      typeInfo.parameters = type.getIntersectionTypes().map((t) => getTypeInfo(t))
      break
    default:
      typeInfo.parameters = type.getTypeArguments().map((a) => getTypeInfo(a))
  }

  // baseName is used for referencing the type in the metadata
  if ([TypeOf.Class, TypeOf.Object, TypeOf.Other].includes(typeInfo.typeOf)) {
    // getSymbol() is used for complex types, in which cases getText() returns too much information (e.g. Map<User> instead of just Map)
    typeInfo.baseName = type.getSymbol()?.getName() || type.getText()
  } else {
    typeInfo.baseName = typeInfo.typeOf
  }

  return typeInfo
}
