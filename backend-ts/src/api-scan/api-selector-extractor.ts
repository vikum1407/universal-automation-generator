export class APISelectorExtractor {
  extract(swaggerJson: any) {
    const paths = swaggerJson.paths || {};
    const result: Record<string, any> = {};

    for (const pathKey of Object.keys(paths)) {
      const methods = paths[pathKey];
      result[pathKey] = {};

      for (const methodKey of Object.keys(methods)) {
        result[pathKey][methodKey] = methods[methodKey];
      }
    }

    return result;
  }
}
