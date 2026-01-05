import { Gender } from "./enums"

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