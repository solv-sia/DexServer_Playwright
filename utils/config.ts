import * as dotenv from 'dotenv';
import * as path from 'path';
import configJson from './configuration.json';

dotenv.config({ path: path.resolve(__dirname, '../.env.demo5') });

function randomAlphaNumeric(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

const config = {
  baseUrl: process.env.BASE_URL_DEX ?? '',

  userName: 'testermation',
  password: 'QA!2023+',

  clientName: configJson.clientName,
  newClientName: configJson.newClientName,

  // CP05PP
  ownerEmail: `${randomAlphaNumeric(5)}@gmail.com`,
  ownerUserName: configJson.ownerUserName,
  ownerRoleName: configJson.ownerRoleName,
  passwordUserCP05PP: 'Abcd1234%',
  clientNameCP05PP: configJson.clientNameCP05PP,

  // CP06PP
  noOwnerEmail: `${randomAlphaNumeric(5)}@gmail.com`,
  noOwnerUserName: configJson.noOwnerUserName,
  roleName: configJson.roleName,
  clientNameCP06PP: configJson.clientNameCP06PP,

  // CP08PP
  fileUploadPath: configJson.fileUploadPath,
  uploadFolderName: configJson.uploadFolderName,
  fileName1: configJson.fileName1,
  fileName2: configJson.fileName2,
  fileName3: configJson.fileName3,
  fileName4: configJson.fileName4,
  expectedVideoFormat: configJson.expectedVideoFormat,
  expectedImageFormat: configJson.expectedImageFormat,
  expectedVideoDimension: configJson.expectedVideoDimension,
  expectedImageDimension: configJson.expectedImageDimension,
  expectedVideoSize: configJson.expectedVideoSize,
  expectedImageSize: configJson.expectedImageSize,

  // CP09PP
  frameQty: configJson.frameQty,
  frameOrientation: configJson.frameOrientation,
  layoutDisposition: configJson.layoutDisposition,
  defaultLayout: configJson.defaultLayout,

  // CP10PP
  ruta: configJson.ruta,
  medias: configJson.medias,
};

export default config;
