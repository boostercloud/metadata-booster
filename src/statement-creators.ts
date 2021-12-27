import * as ts from 'typescript'
import { ClassInfo, PropertyInfo, TypeInfo } from './metadata-extractors'

export function createClassMetadataDecorator(
  f: ts.NodeFactory,
  classInfo: ClassInfo,
  typesByModule: Record<string, string>
): ts.Decorator {
  return f.createDecorator(
    f.createCallExpression(f.createPropertyAccessExpression(f.createIdentifier('Reflect'), 'metadata'), undefined, [
      f.createStringLiteral('booster:typeinfo'),
      f.createObjectLiteralExpression(
        [
          f.createPropertyAssignment('name', f.createStringLiteral(classInfo.name)),
          f.createPropertyAssignment('type', f.createIdentifier(classInfo.name)),
          f.createPropertyAssignment('fields', createPropertiesMetadata(f, classInfo.fields, typesByModule)),
          f.createPropertyAssignment('methods', createPropertiesMetadata(f, classInfo.methods, typesByModule)),
        ],
        true
      ),
    ])
  )
}

function createPropertiesMetadata(
  f: ts.NodeFactory,
  properties: Array<PropertyInfo>,
  typesByModule: Record<string, string>
): ts.ArrayLiteralExpression {
  return f.createArrayLiteralExpression(
    properties.map((prop) => {
      return f.createObjectLiteralExpression(
        [
          f.createPropertyAssignment('name', f.createStringLiteral(prop.name)),
          f.createPropertyAssignment('typeInfo', createMetadataForTypeInfo(f, prop.typeInfo, typesByModule)),
        ],
        true
      )
    }, true)
  )
}

function createMetadataForTypeInfo(
  f: ts.NodeFactory,
  typeInfo: TypeInfo,
  typesByModule: Record<string, string>
): ts.ObjectLiteralExpression {
  const typeModule = typeInfo.typeName && typesByModule[typeInfo.typeName]
  const properties: ts.ObjectLiteralElementLike[] = [
    f.createPropertyAssignment('name', f.createStringLiteral(typeInfo.name)),
    f.createPropertyAssignment('typeGroup', f.createStringLiteral(typeInfo.typeGroup)),
    f.createPropertyAssignment('isNullable', typeInfo.isNullable ? f.createTrue() : f.createFalse()),
    f.createPropertyAssignment(
      'parameters',
      f.createArrayLiteralExpression(
        typeInfo.parameters.map((param) => createMetadataForTypeInfo(f, param, typesByModule))
      )
    ),
  ]
  if (typeModule) properties.push(f.createPropertyAssignment('importPath', f.createStringLiteral(typeModule)))
  if (typeInfo.typeName) {
    properties.push(
      f.createPropertyAssignment('typeName', f.createStringLiteral(typeInfo.typeName)),
      f.createPropertyAssignment(
        'type',
        typeModule
          ? /* eslint-disable indent */
            f.createPropertyAccessExpression(
              f.createCallExpression(f.createIdentifier('require'), undefined, [
                f.createStringLiteral(typeModule || ''),
              ]),
              f.createIdentifier(typeInfo.typeName)
            )
          : f.createIdentifier(typeInfo.typeName)
        /* eslint-enable indent */
      )
    )
  }
  return f.createObjectLiteralExpression(properties, true)
}
