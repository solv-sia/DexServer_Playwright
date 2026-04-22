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

  // CP11PP+
  playerCP11PP: configJson.playerCP11PP,
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
  scheduleCP19PP: configJson.scheduleCP19PP,
  playlistDefaultCP19PP: configJson.playlistDefaultCP19PP,
  playlistDefaultCP19BackUp: configJson.playlistDefaultCP19BackUp,
  scheduleCP19BackUp: configJson.scheduleCP19BackUp,
  machineIdCP19: configJson.machineIdCP19,
  messageKeyCP19: configJson.messageKeyCP19,
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
  previousVersion: configJson.previousVersion,
  latestVersion: configJson.latestVersion,

  // CP23PP
  machineIdCP23PP: configJson.machineIdCP23PP,
  messageKeyCP23PP: configJson.messageKeyCP23PP,

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
