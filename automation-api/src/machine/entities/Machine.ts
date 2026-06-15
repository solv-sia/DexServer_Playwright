export class Machine {
    MachineId: number;
    CustomerId: number;
    Name: string;
    ActivationKey: string;
    SerialNumber: string;
    MessageKey: string;

    constructor(
      MachineId: number,
      CustomerId: number,
      Name: string,
      ActivationKey: string,
      SerialNumber: string,
      MessageKey: string,
    ){
      this.MachineId = MachineId;
      this.CustomerId = CustomerId;
      this.Name = Name;
      this.ActivationKey = ActivationKey;
      this.SerialNumber = SerialNumber;
      this.MessageKey = MessageKey;
    }
  }