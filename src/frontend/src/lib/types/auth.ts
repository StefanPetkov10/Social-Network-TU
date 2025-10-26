export enum Gender {
    Male = 0,
    Female = 1,
    Other = 2,
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  sex: Gender | number;
  userName: string;
  email: string;
  password: string;
}