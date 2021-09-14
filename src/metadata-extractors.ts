import { createWrappedNode, Node, SyntaxKind, Type } from 'ts-morph'
import * as ts from 'typescript'
import { TypeGroup } from './metadata-types'

export interface TypeInfo {
  name: string
  baseName: string
  parameters: Array<TypeInfo>
  typeGroup: TypeGroup
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
    fields: node.getInstanceProperties().map((p) => ({ name: p.getName(), typeInfo: getTypeInfo(p.getType(), p) })),
    methods: node.getInstanceMethods().map((m) => ({ name: m.getName(), typeInfo: getTypeInfo(m.getReturnType(), m) })),
  }
}

function getTypeInfo(type: Type, node?: Node): TypeInfo {
  const typeGroupTuples: [(t: Type) => boolean, TypeGroup][] = [
    [(t) => t.isString(), TypeGroup.String],
    [(t) => t.isNumber(), TypeGroup.Number],
    [(t) => t.isBoolean(), TypeGroup.Boolean],
    [(t) => t.isEnum(), TypeGroup.Enum],
    [(t) => t.isUnion(), TypeGroup.Union],
    [(t) => t.isIntersection(), TypeGroup.Intersection],
    [(t) => t.isClass(), TypeGroup.Class],
    [(t) => t.isInterface(), TypeGroup.Interface],
    [(t) => t.getAliasSymbol() != null, TypeGroup.Type],
    [(t) => t.isArray(), TypeGroup.Array],
    [(t) => t.getCallSignatures().length > 0, TypeGroup.Function],
    [(t) => t.isObject(), TypeGroup.Object],
  ]
  const isNullable = type.isNullable()
  type = type.getNonNullableType()
  const typeInfo: TypeInfo = {
    name: type.getText(node), // node is passed for better name printing: https://github.com/dsherret/ts-morph/issues/907
    baseName: '',
    typeGroup: typeGroupTuples.find(([fn]) => fn(type))?.[1] || TypeGroup.Other,
    isNullable: isNullable,
    parameters: [],
  }
  switch (typeInfo.typeGroup) {
    case TypeGroup.Enum:
      typeInfo.parameters = type
        .getUnionTypes()
        .map((t) => getTypeInfo(t))
        .map((t) => ({ ...t, name: t.baseName, baseName: t.name })) // e.g. { name: "Small", baseName: "Size.Small" }
      break
    case TypeGroup.Union:
      typeInfo.parameters = type.getUnionTypes().map((t) => getTypeInfo(t, node))
      break
    case TypeGroup.Intersection:
      typeInfo.parameters = type.getIntersectionTypes().map((t) => getTypeInfo(t, node))
      break
    default:
      typeInfo.parameters = type.getTypeArguments().map((a) => getTypeInfo(a, node))
  }

  // baseName is used for referencing the type in the metadata
  if (
    [TypeGroup.Enum, TypeGroup.Class, TypeGroup.Interface, TypeGroup.Type, TypeGroup.Object, TypeGroup.Other].includes(
      typeInfo.typeGroup
    )
  ) {
    // getSymbol() is used for complex types, in which cases getText() returns too much information (e.g. Map<User> instead of just Map)
    typeInfo.baseName = type.getSymbol()?.getName() || type.getText(node)
  } else {
    typeInfo.baseName = typeInfo.typeGroup
  }

  return typeInfo
}
