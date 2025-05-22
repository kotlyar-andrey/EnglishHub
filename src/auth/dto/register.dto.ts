import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsEqual } from 'src/common/validators/IsEqual.validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsEqual('password', { message: 'Passwords do not match' })
  passwordConfirm: string;
}
