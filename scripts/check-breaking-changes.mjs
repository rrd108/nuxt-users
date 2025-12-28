
import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from '@vue/compiler-sfc';
import { Project, SyntaxKind, InterfaceDeclaration } from 'ts-morph';
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
          if (expression.getText() === 'defineEmits') {
            const argument = callExpression.getArguments()[0];
            if (argument && argument.getKind() === SyntaxKind.ArrayLiteralExpression) {
              for (const element of argument.getElements()) {
                emits.push(element.getText().replace(/['"]/g, ''));
              }
            }
          } else if (expression.getText() === 'withDefaults') {
            const withDefaultsArgs = callExpression.getArguments();
            if (withDefaultsArgs.length > 0) {
              const definePropsCall = withDefaultsArgs[0];
              if (definePropsCall && definePropsCall.isKind(SyntaxKind.CallExpression) && definePropsCall.getExpression().getText() === 'defineProps') {
                const typeArgs = definePropsCall.getTypeArguments()[0];
                if (typeArgs) {
                  const typeName = typeArgs.getText();
                  const interfaceDeclaration = sourceFile.getInterface(typeName);
                  if (interfaceDeclaration) {
                    for (const property of interfaceDeclaration.getProperties()) {
                      props[property.getName()] = property.getType().getText();
                    }
                  }
                }
              }
            }
          } else if (expression.getText() === 'defineProps') {
            const typeArgs = callExpression.getTypeArguments()[0];
            if (typeArgs) {
              const typeName = typeArgs.getText();
              const interfaceDeclaration = sourceFile.getInterface(typeName);
              if (interfaceDeclaration) {
                for (const property of interfaceDeclaration.getProperties()) {
                  props[property.getName()] = property.getType().getText();
                }
              }
            } else {
              const argument = callExpression.getArguments()[0];
              if (argument && argument.isKind(SyntaxKind.ObjectLiteralExpression)) {
                for (const property of argument.getProperties()) {
                  if (property.isKind(SyntaxKind.PropertyAssignment)) {
                    props[property.getName()] = property.getInitializer().getText();
                  }
                }
              }
            }
          }
        }
        const interfaceDeclaration = sourceFile.getInterface('Props');
        if (interfaceDeclaration) {
          for (const property of interfaceDeclaration.getProperties()) {
            props[property.getName()] = property.getType().getText();
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

async function getCurrentApi() {
  return {
    moduleOptions: await getModuleOptionsApi(),
    components: await getComponentsApi(),
    composables: await getComposablesApi(),
  };
}

async function checkBreakingChanges() {
  const snapshotPath = resolve(process.cwd(), 'api-snapshot.json');
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf-8'));
  const currentApi = await getCurrentApi();
  const breakingChanges = [];

  // Compare module options
  for (const option of snapshot.moduleOptions) {
    if (!currentApi.moduleOptions.includes(option)) {
      breakingChanges.push(`Module option removed: ${option}`);
    }
  }

  // Compare components
  for (const componentName in snapshot.components) {
    const snapshotComponent = snapshot.components[componentName];
    const currentComponent = currentApi.components[componentName];

    if (!currentComponent) {
      breakingChanges.push(`Component removed: ${componentName}`);
      continue;
    }

    for (const prop of snapshotComponent.props) {
      if (!currentComponent.props.includes(prop)) {
        breakingChanges.push(`Component ${componentName} prop removed: ${prop}`);
      }
    }

    for (const slot of snapshotComponent.slots) {
      if (!currentComponent.slots.includes(slot)) {
        breakingChanges.push(`Component ${componentName} slot removed: ${slot}`);
      }
    }

    for (const emit of snapshotComponent.emits) {
      if (!currentComponent.emits.includes(emit)) {
        breakingChanges.push(`Component ${componentName} emit removed: ${emit}`);
      }
    }
  }

  // Compare composables
  for (const composableName in snapshot.composables) {
    const snapshotComposable = snapshot.composables[composableName];
    const currentComposable = currentApi.composables[composableName];

    if (!currentComposable) {
      breakingChanges.push(`Composable removed: ${composableName}`);
      continue;
    }

    if (JSON.stringify(snapshotComposable) !== JSON.stringify(currentComposable)) {
      breakingChanges.push(`Composable ${composableName} signature changed from ${JSON.stringify(snapshotComposable)} to ${JSON.stringify(currentComposable)}`);
    }
  }

  if (breakingChanges.length > 0) {
    console.error('Breaking changes detected:');
    for (const change of breakingChanges) {
      console.error(`- ${change}`);
    }
    process.exit(1);
  } else {
    console.log('No breaking changes detected.');
  }
}

checkBreakingChanges();
