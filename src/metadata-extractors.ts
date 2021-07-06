import { createWrappedNode, SyntaxKind, Type } from 'ts-morph'
import * as ts from 'typescript'

export interface TypeInfo {
  name: string
  parameters: Array<TypeInfo>
  isNullable: boolean
  isEnum: boolean
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
  const isNullable = type.isNullable()
  type = type.getNonNullableType()
  const typeInfo: TypeInfo = {
    name: type.getSymbol()?.getName() || type.getText(), // getSymbol() is used for complex types, in which cases getText() returns too much information (e.g. Map<User> instead of just Map)
    isNullable: isNullable,
    isEnum: type.isEnum(),
    parameters: type.getTypeArguments().map((a) => getTypeInfo(a)),
  }
  if (typeInfo.isEnum) {
    typeInfo.parameters = type
      .getUnionTypes()
      .map((t) => ({ name: t.getSymbol()?.getName() || t.getText(), isNullable: false, isEnum: false, parameters: [] }))
  }
  if (typeInfo.name.length > 0) typeInfo.name = typeInfo.name[0].toUpperCase() + typeInfo.name.slice(1)
  return typeInfo
}
