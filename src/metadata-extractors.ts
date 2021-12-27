import { createWrappedNode, Node, SyntaxKind, Type } from 'ts-morph'
import * as ts from 'typescript'
import { TypeGroup } from './metadata-types'

export interface TypeInfo {
  name: string // e.g. Array<string>
  typeName: string | null // e.g. Array
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
    methods: node.getMethods().map((m) => ({ name: m.getName(), typeInfo: getTypeInfo(m.getReturnType(), m) })),
  }
}

function getTypeInfo(type: Type, node?: Node): TypeInfo {
  const typeGroupTuples: [(t: Type) => boolean, TypeGroup][] = [
    [(t) => t.isString(), 'String'],
    [(t) => t.isNumber(), 'Number'],
    [(t) => t.isBoolean(), 'Boolean'],
    [(t) => t.isEnum(), 'Enum'],
    [(t) => t.isUnion(), 'Union'],
    [(t) => t.isIntersection(), 'Intersection'],
    [(t) => t.isClass(), 'Class'],
    [(t) => t.isInterface(), 'Interface'],
    [(t) => t.getAliasSymbol() != null, 'Type'],
    [(t) => t.isArray(), 'Array'],
    [(t) => t.getCallSignatures().length > 0, 'Function'],
    [(t) => t.isObject(), 'Object'],
  ]
  const isNullable = type.isNullable()
  type = type.getNonNullableType()
  const typeInfo: TypeInfo = {
    name: type.getText(node), // node is passed for better name printing: https://github.com/dsherret/ts-morph/issues/907
    typeName: '',
    typeGroup: typeGroupTuples.find(([fn]) => fn(type))?.[1] || 'Other',
    isNullable,
    parameters: [],
  }
  switch (typeInfo.typeGroup) {
    case 'Enum':
      typeInfo.parameters = type.getUnionTypes().map((t) => getTypeInfo(t))
      break
    case 'Union':
      typeInfo.parameters = type.getUnionTypes().map((t) => getTypeInfo(t, node))
      break
    case 'Intersection':
      typeInfo.parameters = type.getIntersectionTypes().map((t) => getTypeInfo(t, node))
      break
    default:
      typeInfo.parameters = type.getTypeArguments().map((a) => getTypeInfo(a, node))
  }

  // typeName is used for referencing the type in the metadata
  switch (typeInfo.typeGroup) {
    case 'String':
    case 'Number':
    case 'Boolean':
      typeInfo.typeName = typeInfo.typeGroup
      break
    case 'Union':
    case 'Intersection':
      typeInfo.typeName = null
      break
    case 'Enum':
    case 'Class':
    case 'Array':
      // getSymbol() is used for complex types, in which cases getText() returns too much information (e.g. Map<User> instead of just Map)
      typeInfo.typeName = type.getSymbol()?.getName() || ''
      break
    case 'Object':
      typeInfo.typeName = type.getSymbol()?.getName() || ''
      if (typeInfo.typeName === '__type') {
        // This happens for literal objects like `{ a: string, b: { c: string } }`
        typeInfo.typeName = 'Object'
      }
      break
    case 'Interface':
    case 'Type':
    case 'Function':
    case 'Other':
      if (type.isEnumLiteral()) {
        typeInfo.name = type.getSymbol()?.getName() || '' // e.g. "Small"
      }
      typeInfo.typeName = null
      break
  }

  if (typeInfo.typeName === '') throw new Error(`Could not extract typeName for type ${JSON.stringify(typeInfo)}`)

  return typeInfo
}
