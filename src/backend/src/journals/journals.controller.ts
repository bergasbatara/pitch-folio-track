import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JournalsService } from "./journals.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { UpdateJournalEntryDto } from "./dto/update-journal-entry.dto";

@UseGuards(JwtAuthGuard)
@Controller("companies/:companyId/journals")
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Get()
  list(@Req() req: { user: { sub: string } }, @Param("companyId") companyId: string) {
    return this.journalsService.listEntries(req.user.sub, companyId);
  }

  @Get(":entryId")
  get(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("entryId") entryId: string,
  ) {
    return this.journalsService.getEntry(req.user.sub, companyId, entryId);
  }

  @Post()
  create(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalsService.createEntry(req.user.sub, companyId, dto);
  }

  @Patch(":entryId")
  update(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("entryId") entryId: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.journalsService.updateEntry(req.user.sub, companyId, entryId, dto);
  }

  @Delete(":entryId")
  remove(
    @Req() req: { user: { sub: string } },
    @Param("companyId") companyId: string,
    @Param("entryId") entryId: string,
  ) {
    return this.journalsService.deleteEntry(req.user.sub, companyId, entryId);
  }
}
