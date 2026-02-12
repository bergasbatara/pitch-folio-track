import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CompaniesService } from "./companies.service";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { AddMemberDto } from "./dto/add-member.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Req() req: { user: { sub: string } }, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createCompany(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: { user: { sub: string } }) {
    return this.companiesService.listCompanies(req.user.sub);
  }

  @Get("current")
  current(@Req() req: { user: { sub: string } }) {
    return this.companiesService.getCurrentCompany(req.user.sub);
  }

  @Get(":companyId")
  get(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.companiesService.getCompany(req.user.sub, companyId);
  }

  @Patch(":companyId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(req.user.sub, companyId, dto);
  }

  @Get(":companyId/members")
  listMembers(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.companiesService.listMembers(req.user.sub, companyId);
  }

  @Post(":companyId/members")
  addMember(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.companiesService.addMember(req.user.sub, companyId, dto);
  }

  @Delete(":companyId/members/:memberUserId")
  removeMember(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("memberUserId") memberUserId: string,
  ) {
    return this.companiesService.removeMember(req.user.sub, companyId, memberUserId);
  }
}
