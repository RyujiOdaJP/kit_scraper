import s from 'shelljs';
import config from './tsconfig.json';
const outDir = config.compilerOptions.outDir;
import {
  generateRoutes,
  generateSwaggerSpec,
  RoutesConfig,
  SwaggerConfig,
} from 'tsoa';

s.rm('-rf', outDir);
s.mkdir(outDir);
s.cp('.env', `${outDir}/.env`);

(async (): Promise<void> => {
  // Define setting of automatic generating Swagger.json
  const swaggerOptions: SwaggerConfig = {
    basePath: '/api',
    entryFile: './server/common/server.ts',
    specVersion: 3,
    outputDirectory: './server/common/',
    controllerPathGlobs: ['./server/api/controllers/*/index.ts'],
  };

  // Define setting of Automatic generating routing file
  const routeOptions: RoutesConfig = {
    basePath: '/api',
    entryFile: './server/common/server.ts',
    routesDir: './server',
  };

  // Run those
  await generateSwaggerSpec(swaggerOptions, routeOptions);
  await generateRoutes(routeOptions, swaggerOptions);
})();
