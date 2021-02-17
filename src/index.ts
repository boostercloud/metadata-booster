import * as ts from 'typescript'
import { getClassInfo } from './metadata-extractors'
import {
  createClassMetadataStatement,
  createFilterInterfaceFunction,
} from './statement-creators'

const transformer: (
  program: ts.Program
) => ts.TransformerFactory<ts.SourceFile> = (program) => {
  const checker = program.getTypeChecker()
  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (
    context
  ) => {
    const f = context.factory
    const filterInterfaceFunctionName = f.createUniqueName('filterInterface')
    return (sourceFile) => {
      function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if (ts.isImportDeclaration(node)) {
          // To ensure we import 'reflect-metadata', delete it from the file in case it is already there.
          // Later we will add it.
          const quotedModuleName = node.moduleSpecifier.getText()
          const moduleName = quotedModuleName.replace(/['']/g, '')
          if (moduleName == 'reflect-metadata') {
            return undefined
          }
        }
        if (ts.isClassDeclaration(node)) {
          const classInfo = getClassInfo(node, context, checker)
          if (classInfo) {
            return [
              node,
              createClassMetadataStatement(
                f,
                classInfo,
                filterInterfaceFunctionName
              ),
            ]
          }
        }
        return ts.visitEachChild(node, visitor, context)
      }
      const modifiedSourceFile = ts.visitNode(sourceFile, visitor)
      return f.updateSourceFile(modifiedSourceFile, [
        f.createImportDeclaration(
          undefined,
          undefined,
          undefined,
          f.createStringLiteral('reflect-metadata')
        ),
        ...modifiedSourceFile.statements,
        createFilterInterfaceFunction(f, filterInterfaceFunctionName),
      ])
    }
  }

  return transformerFactory
}

export default transformer