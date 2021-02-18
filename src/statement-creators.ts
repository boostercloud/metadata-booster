import * as ts from 'typescript'
import { ClassInfo, PropertyInfo, TypeInfo } from './metadata-extractors'

export function createClassMetadataDecorator(
  f: ts.NodeFactory,
  classInfo: ClassInfo,
  filterInterfaceFunctionName: ts.Identifier
): ts.Decorator {
  return f.createDecorator(
    f.createCallExpression(
      f.createPropertyAccessExpression(
        f.createIdentifier('Reflect'),
        'metadata'
      ),
      undefined,
      [
        f.createStringLiteral('booster:typeinfo'),
        f.createObjectLiteralExpression(
          [
            f.createPropertyAssignment(
              'name',
              f.createStringLiteral(classInfo.name)
            ),
            f.createPropertyAssignment(
              'type',
              f.createIdentifier(classInfo.name)
            ),
            f.createPropertyAssignment(
              'fields',
              createPropertiesMetadata(
                f,
                classInfo.fields,
                filterInterfaceFunctionName
              )
            ),
            f.createPropertyAssignment(
              'methods',
              createPropertiesMetadata(
                f,
                classInfo.methods,
                filterInterfaceFunctionName
              )
            ),
          ],
          true
        )
      ]
    )
  )
}

function createPropertiesMetadata(
  f: ts.NodeFactory,
  properties: Array<PropertyInfo>,
  filterInterfaceFunctionName: ts.Identifier
): ts.ArrayLiteralExpression {
  return f.createArrayLiteralExpression(
    properties.map((prop) => {
      return f.createObjectLiteralExpression(
        [
          f.createPropertyAssignment('name', f.createStringLiteral(prop.name)),
          f.createPropertyAssignment(
            'typeInfo',
            createMetadataForTypeInfo(
              f,
              prop.typeInfo,
              filterInterfaceFunctionName
            )
          ),
        ],
        true
      )
    }, true)
  )
}

function createMetadataForTypeInfo(
  f: ts.NodeFactory,
  typeInfo: TypeInfo,
  filterInterfaceFunctionName: ts.Identifier
): ts.ObjectLiteralExpression {
  return f.createObjectLiteralExpression(
    [
      f.createPropertyAssignment(
        'name',
        f.createStringLiteral(typeInfo.name),
      ),
      f.createPropertyAssignment(
        'type',
        f.createCallExpression(filterInterfaceFunctionName, undefined, [
          f.createStringLiteral(typeInfo.name),
        ])
      ),
      f.createPropertyAssignment(
        'parameters',
        f.createArrayLiteralExpression(
          typeInfo.parameters.map((param) =>
            createMetadataForTypeInfo(f, param, filterInterfaceFunctionName)
          )
        )
      ),
    ],
    true
  )
}

export function createFilterInterfaceFunction(
  f: ts.NodeFactory,
  filterInterfaceFunctionName: ts.Identifier
): ts.FunctionDeclaration {
  return f.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    filterInterfaceFunctionName,
    undefined,
    [
      f.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        'typeName',
        undefined,
        undefined,
        undefined
      ),
    ],
    undefined,
    f.createBlock(
      [
        f.createTryStatement(
          f.createBlock(
            [
              f.createReturnStatement(
                f.createCallExpression(f.createIdentifier('eval'), undefined, [
                  f.createIdentifier('typeName'),
                ])
              ),
            ],
            false
          ),
          f.createCatchClause(
            undefined,
            f.createBlock(
              [f.createReturnStatement(f.createIdentifier('undefined'))],
              false
            )
          ),
          undefined
        ),
      ],
      false
    )
  )
}
