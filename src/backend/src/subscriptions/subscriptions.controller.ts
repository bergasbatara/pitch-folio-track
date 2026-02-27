import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { SubscriptionsService } from "./subscriptions.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/subscription")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  getCurrent(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.subscriptionsService.getCurrent(req.user.sub, companyId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(req.user.sub, companyId, dto);
  }

  @Patch()
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(req.user.sub, companyId, dto);
  }
}
