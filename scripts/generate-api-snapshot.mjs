
import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from '@vue/compiler-sfc';
import { Project, SyntaxKind, VariableDeclaration } from 'ts-morph';
import { defaultOptions } from '../src/module.ts';

async function getComponentsApi() {
  const componentsPath = resolve(process.cwd(), 'src/runtime/components');
  const files = await readdir(componentsPath);
  const components = {};

  for (const file of files) {
    if (file.endsWith('.vue')) {
      const componentName = file.replace('.vue', '');
      const content = await readFile(resolve(componentsPath, file), 'utf-8');
      const { descriptor } = parse(content);

      const props = {};
      const emits = [];
      if (descriptor.scriptSetup) {
        const project = new Project({ useInMemoryFileSystem: true });
        const sourceFile = project.createSourceFile('component.ts', descriptor.scriptSetup.content);
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
        for (const callExpression of callExpressions) {
          const expression = callExpression.getExpression();
          if (expression.getText() === 'defineProps') {
            const argument = callExpression.getArguments()[0];
            if (argument && argument.getKind() === SyntaxKind.ObjectLiteralExpression) {
              for (const property of argument.getProperties()) {
                if (property.isKind(SyntaxKind.PropertyAssignment)) {
                  props[property.getName()] = property.getInitializer().getText();
                }
              }
            }
          } else if (expression.getText() === 'defineEmits') {
            const argument = callExpression.getArguments()[0];
            if (argument && argument.getKind() === SyntaxKind.ArrayLiteralExpression) {
              for (const element of argument.getElements()) {
                emits.push(element.getText().replace(/['"]/g, ''));
              }
            }
          }
        }
      }

      const slots = [];
      if (descriptor.template) {
        const matches = descriptor.template.content.matchAll(/<slot[^\/>]*?(?:\sname="([^"]+)")/g);
        for (const match of matches) {
          slots.push(match[1] || 'default');
        }
      }

      components[componentName] = {
        props: Object.keys(props),
        slots: [...new Set(slots)],
        emits,
      };
    }
  }

  return components;
}

async function getComposablesApi() {
  const composablesPath = resolve(process.cwd(), 'src/runtime/composables');
  const files = await readdir(composablesPath);
  const composables = {};
  const project = new Project();

  for (const file of files) {
    if (file.endsWith('.ts')) {
      const sourceFile = project.addSourceFileAtPath(resolve(composablesPath, file));
      const exportedDeclarations = sourceFile.getExportedDeclarations();
      for (const [name, declarations] of exportedDeclarations) {
        for (const declaration of declarations) {
          if (declaration.isKind(SyntaxKind.VariableDeclaration)) {
            const initializer = declaration.getInitializer();
            if (initializer && (initializer.isKind(SyntaxKind.ArrowFunction) || initializer.isKind(SyntaxKind.FunctionExpression))) {
              const signature = initializer.getSignature();
              composables[name] = {
                parameters: signature.getParameters().map(p => p.getName()),
                returnType: signature.getReturnType().getText(),
              };
            }
          }
        }
      }
    }
  }

  return composables;
}

async function getModuleOptionsApi() {
  return Object.keys(defaultOptions);
}

async function generateApiSnapshot() {
  const api = {
    moduleOptions: await getModuleOptionsApi(),
    components: await getComponentsApi(),
    composables: await getComposablesApi(),
  };

  await writeFile(resolve(process.cwd(), 'api-snapshot.json'), JSON.stringify(api, null, 2));
}

generateApiSnapshot();
