import * as dotenv from 'dotenv';
import * as path from 'path';
import configJson from './configuration.json';
import dateFormatter from './dateFormatter';

dotenv.config({ path: path.resolve(__dirname, '../.env.demo5') });

function randomAlphaNumeric(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

const config = {
  baseUrl: process.env.BASE_URL_DEX ?? '',

  userName: 'testermation',
  userName2: 'testermation2',
  password: 'QA!2023+',

  clientName: configJson.clientName,
  clientNameFiltros: configJson.clientNameFiltros,
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

  // Automation API
  automationApiUrl: process.env.AUTOMATION_API_URL ?? 'http://localhost:3050',
  automationApiToken: process.env.AUTOMATION_API_TOKEN ?? '',
  automationApiDbKey: process.env.AUTOMATION_API_DB_KEY ?? 'demo5',

  // CP11PP+
  playerCP11PP: `${configJson.playerCP11PP} ${dateFormatter.datetime()}`,
  playerCP14PP: `${configJson.playerCP14PP} ${dateFormatter.datetime()}`,
  playerCP34PP: `${configJson.playerCP34PP} ${dateFormatter.datetime()}`,
  playerCP16PP1: `${configJson.playerCP16PP1} ${dateFormatter.datetime()}`,
  playerCP16PP2: `${configJson.playerCP16PP2} ${dateFormatter.datetime()}`,
  playerCP21PP1: `${configJson.playerCP21PP1} ${dateFormatter.datetime()}`,
  playerCP21PP2: `${configJson.playerCP21PP2} ${dateFormatter.datetime()}`,
  playerCP29PP1: `${configJson.playerCP29PP1} ${dateFormatter.datetime()}`,
  playerCP29PP2: `${configJson.playerCP29PP2} ${dateFormatter.datetime()}`,
  playerCP30PP1: `${configJson.playerCP30PP1} ${dateFormatter.datetime()}`,
  playerCP30PP2: `${configJson.playerCP30PP2} ${dateFormatter.datetime()}`,
  playerCP38PP: `${configJson.playerCP38PP} ${dateFormatter.datetime()}`,
  tenant31: configJson.tenant31,
  tenantActivationKeyCP11PP: configJson.tenantActivationKeyCP11PP,
  tenantActivationKeyCP14PP: configJson.tenantActivationKeyCP14PP,
  tenantActivationKeyCP16PP: configJson.tenantActivationKeyCP16PP,
  player1: configJson.player1,
  player2: configJson.player2,
  emptyGroupName: configJson.emptyGroupName,
  nameGroup: configJson.nameGroup,

  // CP13PP
  calendarPL: configJson.calendarPL,

  // CP14PP
  playlistNameToInherit: configJson.playlistNameToInherit,
  scheduleNameToInherit: configJson.scheduleNameToInherit,
  transmissionPolicyNameToInherit: configJson.transmissionPolicyNameToInherit,
  hardwarePolicyNameToInherit: configJson.hardwarePolicyNameToInherit,
  timeZoneToInherit: configJson.timeZoneToInherit,

  // CP16PP - LNL group
  LNLplaylistName: configJson.LNLplaylistName,
  LNLscheduleName: configJson.LNLscheduleName,
  LNLtransmissionPolicyName: configJson.LNLtransmissionPolicyName,
  LNLhardwarePolicyName: configJson.LNLhardwarePolicyName,

  // CP19PP
  playerCP19PP: configJson.playerCP19PP,
  scheduleCP19PP: configJson.scheduleCP19PP,
  playlistDefaultCP19PP: configJson.playlistDefaultCP19PP,
  playlistDefaultCP19BackUp: configJson.playlistDefaultCP19BackUp,
  scheduleCP19BackUp: configJson.scheduleCP19BackUp,
  playlistDefaultCP19Id: configJson.playlistDefaultCP19Id,
  scheduleCP19Id: configJson.scheduleCP19Id,
  scheduleCP19BackupId: configJson.scheduleCP19BackupId,
  playlistCP19BackupId: configJson.playlistCP19BackupId,

  // CP20PP - sync group
  ipMulticast1: configJson.ipMulticast1,
  ipMulticast2: configJson.ipMulticast2,
  ipMulticast3: configJson.ipMulticast3,
  syncPlaylistName: configJson.syncPlaylistName,
  syncScheduleName: configJson.syncScheduleName,
  syncTransmissionPolicyName: configJson.syncTransmissionPolicyName,
  syncHardwarePolicyName: configJson.syncHardwarePolicyName,
  synchronizationTime: configJson.synchronizationTime,
  searchSyncGroupName: configJson.searchSyncGroupName,

  // CP22PP
  playerCP22PP: configJson.playerCP22PP,
  previousVersion: configJson.previousVersion,
  latestVersion: configJson.latestVersion,

  // CP23PP
  playerCP23PP: configJson.playerCP23PP,
  // CP24PP
  playerCP24PP: configJson.playerCP24PP,
  // CP25PP
  playerCP25PP: configJson.playerCP25PP,
  // CP26PP
  playerCP26PP: configJson.playerCP26PP,

  // CP27/28PP
  replaceAndRemoveMediaPath: configJson.replaceAndRemoveMediaPath,
  removeMediaPath: configJson.removeMediaPath,
  mediaToReplace: configJson.mediaToReplace,
  mediaReplacement: configJson.mediaReplacement,
  mediafolderName: configJson.mediafolderName,
  mediafolder2Name: configJson.mediafolder2Name,
  mediaReplaceAndRemovePlaylist: configJson.mediaReplaceAndRemovePlaylist,

  // CP29PP
  rebootTime: configJson.rebootTime,

  // CP30PP
  blockTime: configJson.blockTime,
  allowTime: configJson.allowTime,

  // CP34PP
  PL_CP34PP: configJson.PL_CP34PP,

  // CP38PP - DexStore
  storeCode: configJson.storeCode,
  completeStoreName: configJson.completeStoreName,
  storeName: configJson.storeName,
  storeCountry: configJson.storeCountry,
  storeProvince: configJson.storeProvince,
  storeLocation: configJson.storeLocation,
  storeStatusInput: configJson.storeStatusInput,

  // CP44PP
  supertenantName: configJson.supertenantName,

  // CP46PP
  machineId: configJson.machineId,
  MediaComponent1: configJson.MediaComponent1,
  MediaComponent2: configJson.MediaComponent2,

  // CP40PP
  PL_CP40PP: configJson.PL_CP40PP,

  // CP47-52PP
  mediaToChangePath: configJson.mediaToChangePath,
  mediaToChange: configJson.mediaToChange,
  listaPLPropagacion: configJson.listaPLPropagacion,

  // CP99PP
  fileToDelete1: configJson.fileToDelete1,
  fileToDelete2: configJson.fileToDelete2,
  fileToDelete3: configJson.fileToDelete3,
  fileToDelete4: configJson.fileToDelete4,

  // General
  timezone: configJson.timezone,
  scheduleDefault: configJson.scheduleDefault,
  playlistDafault: configJson.playlistDafault,
};

export default config;
