import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ChargeCardDto } from "./dto/charge-card.dto";
import { ChargeQrisDto } from "./dto/charge-qris.dto";
import { ChargeGopayDto } from "./dto/charge-gopay.dto";
import { PaymentsService } from "./payments.service";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("charge")
  charge(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: ChargeCardDto,
  ) {
    return this.paymentsService.chargeCard(req.user.sub, companyId, dto);
  }

  @Post("charge/qris")
  chargeQris(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: ChargeQrisDto,
  ) {
    return this.paymentsService.chargeQris(req.user.sub, companyId, dto);
  }

  @Post("charge/gopay")
  chargeGopay(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: ChargeGopayDto,
  ) {
    return this.paymentsService.chargeGopay(req.user.sub, companyId, dto);
  }

  @Get("status/:orderId")
  getStatus(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("orderId") orderId: string,
  ) {
    return this.paymentsService.getPaymentStatus(req.user.sub, companyId, orderId);
  }
}
