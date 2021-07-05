import * as ts from 'typescript'

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

export function getClassInfo(
  classNode: ts.ClassDeclaration,
  context: ts.TransformationContext,
  checker: ts.TypeChecker
): ClassInfo | undefined {
  if (!classNode.name) return

  const properties = checker
    .getPropertiesOfType(checker.getTypeAtLocation(classNode))
    .map((prop) => {
      return getPropertyInfo(prop, context, checker)
    })

  return {
    name: classNode.name.getText(),
    fields: properties.filter((prop) => !prop.isMethod),
    methods: properties.filter((prop) => prop.isMethod),
  }
}

function getPropertyInfo(
  prop: ts.Symbol,
  context: ts.TransformationContext,
  checker: ts.TypeChecker
): PropertyInfo {
  return {
    name: prop.getName(),
    isMethod: ts.isMethodDeclaration(prop.valueDeclaration),
    typeInfo: getTypeInfo(prop.valueDeclaration, context),
  }
}

function getTypeInfo(
  node: ts.Node,
  context: ts.TransformationContext
): TypeInfo {
  const typeInfo: TypeInfo = {
    name: 'undefined',
    parameters: [],
  }
  if (hasNoTypeInfo(node)) {
    return typeInfo
  }

  function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
    if (!ts.isTypeNode(node)) {
      return ts.visitEachChild(node, visitor, context)
    }
    if (ts.isTypeReferenceNode(node)) {
      typeInfo.name = node.typeName.getText()
      typeInfo.parameters =
        node.typeArguments?.map((node) => getTypeInfo(node, context)) ?? []
    } else if (ts.isFunctionTypeNode(node)) {
      typeInfo.name = 'Function' // TODO: We could get more detailed here
    } else if (ts.isArrayTypeNode(node)) {
      typeInfo.name = Array.name
      typeInfo.parameters = [getTypeInfo(node.elementType, context)]
    } else {
      typeInfo.name = normalizeTypeName(node.getText())
    }

    return node
  }

  ts.visitNode(node, visitor)
  return typeInfo
}

function normalizeTypeName(name: string): string {
  if (['string', 'number', 'boolean'].includes(name)) {
    return name[0].toUpperCase() + name.slice(1)
  }
  return name
}

function hasNoTypeInfo(node: ts.Node): boolean {
  return [
    ts.SyntaxKind.AnyKeyword,
    ts.SyntaxKind.NeverKeyword,
    ts.SyntaxKind.SymbolKeyword,
    ts.SyntaxKind.UndefinedKeyword,
    ts.SyntaxKind.UnknownKeyword,
    ts.SyntaxKind.VoidKeyword,
  ].includes(node.kind)
}
