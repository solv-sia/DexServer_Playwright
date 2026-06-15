export class ProofOfPlay {
    ProofOfPlayId: number;
    MachineId: number;
    MediaComponentName: string;

    constructor(ProofOfPlayId: number, MachineId: number, MediaComponentName: string){
      this.ProofOfPlayId = ProofOfPlayId;
      this.MachineId = MachineId;
      this.MediaComponentName = MediaComponentName;
    }
  }