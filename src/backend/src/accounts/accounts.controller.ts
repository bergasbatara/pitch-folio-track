import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.accountsService.listAccounts(req.user.sub, companyId);
  }

  @Get(":accountId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("accountId") accountId: string,
  ) {
    return this.accountsService.getAccount(req.user.sub, companyId, accountId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.createAccount(req.user.sub, companyId, dto);
  }

  @Patch(":accountId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("accountId") accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(req.user.sub, companyId, accountId, dto);
  }

  @Delete(":accountId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("accountId") accountId: string,
  ) {
    return this.accountsService.deleteAccount(req.user.sub, companyId, accountId);
  }
}
