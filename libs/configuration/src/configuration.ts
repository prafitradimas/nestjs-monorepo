import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { AppConfig } from './configuration.type';

const CONFIG_FILENAME = '../../../app-config.yml';

export default (): AppConfig => {
  return yaml.load(
    readFileSync(join(__dirname, CONFIG_FILENAME), 'utf-8'),
  ) as AppConfig;
};
