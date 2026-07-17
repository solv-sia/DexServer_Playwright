// POP - Verificar que se generen los eventos de reproduccion
import { test, expect } from '@playwright/test';
import { getSharedData } from '../utils/sharedData';
import { getProofOfPlayEvents } from '../utils/automationApi';

//este caso queda deprecado: actualmente los eventos POP se encolan con un event hook y demoran hasta una hora en cargarse en BD, por lo que no es posible automatizar el flujo por el momento.


test.describe('POP - Verificar que se generen los eventos de reproduccion', () => {
  test.skip('@CP36PP', async () => {
    const machineId = getSharedData('machineIdCP11PP');

    if (!machineId) {
      throw new Error('machineIdCP11PP not found in shared data');
    }

    const proofOfPlayEvents = await getProofOfPlayEvents(machineId);

    expect(
      proofOfPlayEvents.length,
      `No se encontraron eventos POP para el machineId: ${machineId}`
    ).toBeGreaterThan(0);

    console.log(`Se encontraron ${proofOfPlayEvents.length} eventos POP para el MachineId: ${machineId}`);

    proofOfPlayEvents.forEach((event, index) => {
      console.log(`--- Evento POP #${index + 1} ---`);
      console.log(`MachineId: ${event.MachineId}`);
      console.log(`ProofOfPlayId: ${event.ProofOfPlayId}`);
      console.log(`MediaComponentName: ${event.MediaComponentName}`);
    });
  });
});
