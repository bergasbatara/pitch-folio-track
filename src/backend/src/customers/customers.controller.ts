import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PlanGuard } from "../common/plan/plan.guard";
import { PlanRequired } from "../common/plan/plan-required.decorator";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "./customers.service";

@UseGuards(JwtAuthGuard, PlanGuard)
@PlanRequired("business")
@Controller("companies/:companyId/customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.customersService.listCustomers(req.user.sub, companyId);
  }

  @Get(":customerId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("customerId") customerId: string,
  ) {
    return this.customersService.getCustomer(req.user.sub, companyId, customerId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(req.user.sub, companyId, dto);
  }

  @Patch(":customerId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("customerId") customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(req.user.sub, companyId, customerId, dto);
  }

  @Delete(":customerId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("customerId") customerId: string,
  ) {
    return this.customersService.deleteCustomer(req.user.sub, companyId, customerId);
  }
}
