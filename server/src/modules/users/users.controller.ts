import { Authorized, Controller, CurrentUser, Get } from "routing-controllers";
import type { User } from "./user.entity";
import { usersService } from "./users.service";

@Controller("/users")
export class UsersController {
  @Authorized(["coach", "admin"])
  @Get()
  listUsers(@CurrentUser() user: User) {
    return usersService.listForMessaging(user);
  }
}
