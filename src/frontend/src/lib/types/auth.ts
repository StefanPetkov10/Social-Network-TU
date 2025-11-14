export enum Gender {
    Male = 0,
    Female = 1,
    Other = 2,
}

export interface RegisterDto {
  FirstName: string;
  LastName: string;
  BirthDay: number;
  BirthMonth: number;
  BirthYear: number;
  Sex: Gender | number;
  UserName: string;
  Email: string;
  Password: string;
}