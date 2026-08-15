import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { EquipmentScanService } from './equipment-scan.service';

@Injectable()
export class EquipmentService {
  private static readonly IMAGE_MIMES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  private static readonly IMAGE_MAX_BYTES = 5 * 1024 * 1024;

  constructor(
    private prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly scan: EquipmentScanService,
  ) {}

  async findByCustomer(companyId: string, customerId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, customerId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  async findByHouse(companyId: string, houseId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, houseId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  /**
   * Add equipment to a House (Housing Scheme template). Requires the house to
   * already have an owner assigned — customerId is derived from house.ownerCustomerId
   * and kept required/non-null, avoiding a nullable-customerId migration. See
   * docs/superpowers/specs/2026-07-13-project-templates-housing-scheme-design.md.
   */
  async createForHouse(
    companyId: string,
    houseId: string,
    data: {
      type?: string; brand?: string; model?: string; serialNo?: string;
      installDate?: string; warrantyEnd?: string; notes?: string;
    },
  ) {
    const house = await this.prisma.house.findFirst({ where: { id: houseId, companyId } });
    if (!house) throw new NotFoundException('House not found');
    if (!house.ownerCustomerId) {
      throw new BadRequestException('Assign an owner to this house before adding equipment');
    }
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId: house.ownerCustomerId,
        houseId,
        type: data.type ?? 'Thermostat',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
      },
    });
  }

  /**
   * Re-point customerId on all of a house's equipment when its owner changes.
   * House.ownerCustomerId is authoritative; Equipment.customerId is a denormalized
   * mirror kept in sync here so the portal's "My Equipment" (queried by customerId)
   * never shows a house's equipment to the wrong owner.
   */
  async resyncHouseEquipmentOwner(companyId: string, houseId: string, customerId: string) {
    await this.prisma.equipment.updateMany({
      where: { companyId, houseId },
      data: { customerId },
    });
  }

  // ── Generic project components (spec: docs/superpowers/specs/2026-08-14-project-component-templates-design.md) ──
  // Replaces the three methods above. Kept alongside them during the migration
  // window; the House-based methods are removed in a later cleanup pass.

  async findByComponent(companyId: string, componentId: string) {
    const items = await this.prisma.equipment.findMany({
      where: { companyId, componentId },
      orderBy: { createdAt: 'desc' },
    });
    return this.attachErrorCodes(companyId, items);
  }

  /**
   * Add equipment to a ProjectComponent. Requires the component to already have an
   * owner assigned — customerId is derived from component.ownerCustomerId and kept
   * required/non-null, same rule House-based creation already enforced.
   */
  async createForComponent(
    companyId: string,
    componentId: string,
    data: {
      type?: string; brand?: string; model?: string; serialNo?: string;
      installDate?: string; warrantyEnd?: string; notes?: string;
    },
  ) {
    const component = await this.prisma.projectComponent.findFirst({ where: { id: componentId, companyId } });
    if (!component) throw new NotFoundException('Component not found');
    if (!component.ownerCustomerId) {
      throw new BadRequestException('Assign an owner to this component before adding equipment');
    }
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId: component.ownerCustomerId,
        componentId,
        type: data.type ?? 'Thermostat',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
      },
    });
  }

  /**
   * Re-point customerId on all of a component's equipment when its owner changes.
   * ProjectComponent.ownerCustomerId is authoritative; Equipment.customerId is a
   * denormalized mirror kept in sync here, same rule as resyncHouseEquipmentOwner.
   */
  async resyncComponentEquipmentOwner(companyId: string, componentId: string, customerId: string) {
    await this.prisma.equipment.updateMany({
      where: { companyId, componentId },
      data: { customerId },
    });
  }

  async create(
    companyId: string,
    customerId: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    },
  ) {
    return this.prisma.equipment.create({
      data: {
        companyId,
        customerId,
        type: data.type ?? 'Boiler',
        brand: data.brand,
        model: data.model,
        serialNo: data.serialNo,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
        notes: data.notes,
        manualUrl: data.manualUrl,
      },
    });
  }

  async update(
    companyId: string,
    id: string,
    data: {
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    },
  ) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    return this.prisma.equipment.update({
      where: { id },
      data: {
        ...data,
        installDate: data.installDate ? new Date(data.installDate) : undefined,
        warrantyEnd: data.warrantyEnd ? new Date(data.warrantyEnd) : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    await this.prisma.equipment.delete({ where: { id } });
  }

  /**
   * Returns all equipment with their customer joined, for automation scanning.
   * Filters: active customers only, equipment with installDate or warrantyEnd set.
   * Called by comms-service marketing automation worker.
   */
  async findAutomationCandidates(companyId: string) {
    return this.prisma.equipment.findMany({
      where: {
        companyId,
        customer: { isActive: true },
        OR: [
          { installDate: { not: null } },
          { warrantyEnd: { not: null } },
          { consumables: { some: {} } },
        ],
      },
      include: {
        consumables: true,
        customer: {
          select: {
            id: true,
            companyId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            zipCode: true,
            state: true,
            isActive: true,
          },
        },
      },
    });
  }

  /** Bulk replace all equipment for a customer */
  async replaceForCustomer(
    companyId: string,
    customerId: string,
    items: Array<{
      id?: string;
      type?: string;
      brand?: string;
      model?: string;
      serialNo?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
      manualUrl?: string;
    }>,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.equipment.deleteMany({ where: { companyId, customerId } });
      if (items.length === 0) return [];
      await tx.equipment.createMany({
        data: items.map((eq) => ({
          companyId,
          customerId,
          type: eq.type ?? 'Boiler',
          brand: eq.brand,
          model: eq.model,
          serialNo: eq.serialNo,
          installDate: eq.installDate ? new Date(eq.installDate) : null,
          warrantyEnd: eq.warrantyEnd ? new Date(eq.warrantyEnd) : null,
          notes: eq.notes,
          manualUrl: eq.manualUrl,
        })),
      });
      return tx.equipment.findMany({
        where: { companyId, customerId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  // ── Photo upload + AI scan ─────────────────────────────────────────────────

  /** Upload/replace an equipment photo, then fire (not await) a background AI scan. */
  async uploadImage(companyId: string, id: string, file: { buffer: Buffer; mimetype: string; size: number }) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');

    const ext = EquipmentService.IMAGE_MIMES[file.mimetype];
    if (!ext) throw new BadRequestException('Photo must be a JPEG, PNG or WebP image');
    if (file.size > EquipmentService.IMAGE_MAX_BYTES) {
      throw new BadRequestException('Photo is too large — maximum size is 5 MB');
    }

    const key = `equipment/${companyId}/${id}-${randomUUID()}.${ext}`;
    const imageUrl = await this.storage.putPublicObject(key, file.buffer, file.mimetype);

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: { imageUrl, imageScanStatus: 'SCANNING', imageScanResult: undefined, imageScanError: null },
    });

    void this.scan.scanAndStore(companyId, id, { buffer: file.buffer, mimetype: file.mimetype });

    return updated;
  }

  // ── Error codes ───────────────────────────────────────────────────────────

  async listErrorCodes(companyId: string, equipmentId: string) {
    return this.prisma.equipmentErrorCode.findMany({
      where: { companyId, equipmentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addErrorCode(
    companyId: string,
    equipmentId: string,
    data: { code: string; meaning?: string; source?: 'AI_SCAN' | 'MANUAL' },
  ) {
    const eq = await this.prisma.equipment.findFirst({ where: { id: equipmentId, companyId } });
    if (!eq) throw new NotFoundException('Equipment not found');
    if (!data.code?.trim()) throw new BadRequestException('code is required');
    return this.prisma.equipmentErrorCode.create({
      data: {
        companyId,
        equipmentId,
        code: data.code.trim(),
        meaning: data.meaning?.trim() || null,
        source: data.source === 'AI_SCAN' ? 'AI_SCAN' : 'MANUAL',
      },
    });
  }

  async removeErrorCode(companyId: string, id: string) {
    const row = await this.prisma.equipmentErrorCode.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Error code not found');
    await this.prisma.equipmentErrorCode.delete({ where: { id } });
  }

  private async attachErrorCodes(companyId: string, items: any[]) {
    if (items.length === 0) return items;
    const ids = items.map((i) => i.id);
    const codes = await this.prisma.equipmentErrorCode.findMany({
      where: { companyId, equipmentId: { in: ids } },
      orderBy: { createdAt: 'asc' },
    });
    const byEquipment = new Map<string, any[]>();
    for (const c of codes) {
      if (!byEquipment.has(c.equipmentId)) byEquipment.set(c.equipmentId, []);
      byEquipment.get(c.equipmentId)!.push(c);
    }
    return items.map((i) => ({ ...i, errorCodes: byEquipment.get(i.id) ?? [] }));
  }
}
