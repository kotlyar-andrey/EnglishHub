import { RolesGuard } from 'src/auth/guards/roles.guard';

import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { UserRole } from '../enums/user-roles.enum';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(RolesGuard));
