import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import type { User } from "@prisma/client";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          avatar: dto.avatar,
          address: dto.address,
          phone: dto.phone,
          companyName: dto.companyName,
        },
      });

      const wantsCompanyUpdate =
        dto.companyName !== undefined ||
        dto.address !== undefined ||
        dto.phone !== undefined ||
        dto.taxId !== undefined;

      let company = null;
      if (wantsCompanyUpdate) {
        const membership = await tx.companyMember.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (membership) {
          if (membership.role !== "owner") {
            throw new ForbiddenException("Owner role required");
          }
          company = await tx.company.update({
            where: { id: membership.companyId },
            data: {
              name: dto.companyName !== undefined ? dto.companyName : undefined,
              address: dto.address !== undefined ? dto.address : undefined,
              phone: dto.phone !== undefined ? dto.phone : undefined,
              taxId: dto.taxId !== undefined ? dto.taxId : undefined,
            },
          });
        }
      }

      return { user: this.sanitizeUser(user), company };
    });
  }

  private sanitizeUser(user: User) {
    const { password, refreshTokenHash, ...safe } = user;
    return safe;
  }
}
