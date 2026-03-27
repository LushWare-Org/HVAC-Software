import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, Prisma } from '../prisma/generated';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

function systemToken(companyId: string): string {
  const secret = process.env.JWT_SECRET || 'tscrm-local-jwt-secret-change-in-production';
  return jwt.sign(
    { sub: 'system-inventory-service', company_id: companyId, role: 'company_admin', name: 'Inventory Service', iss: 'tscrm-local' },
    secret,
    { expiresIn: '5m' },
  );
}

@Injectable()
export class StockOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async intake(companyId: string, userId: string, userName: string, dto: {
    inventoryItemId: string;
    toLocationId: string;
    quantity: number;
    referenceId?: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Find or create stock level
      const existing = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId } },
      });

      if (existing) {
        await tx.stockLevel.update({
          where: { id: existing.id },
          data: { quantity: { increment: dto.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId, quantity: dto.quantity, reservedQty: 0 },
        });
      }

      return tx.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dto.inventoryItemId,
          toLocationId: dto.toLocationId,
          quantity: dto.quantity,
          movementType: MovementType.INTAKE,
          referenceId: dto.referenceId,
          referenceType: dto.referenceId ? 'purchase_order' : undefined,
          notes: dto.notes,
          performedBy: userId,
          performedByName: userName,
        },
        include: { inventoryItem: true, toLocation: true },
      });
    });
  }

  async transfer(companyId: string, userId: string, userName: string, dto: {
    inventoryItemId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    notes?: string;
  }) {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException('Cannot transfer to the same location');
    }

    return this.prisma.$transaction(async (tx) => {
      // Check source stock level
      const fromLevel = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.fromLocationId } },
      });

      if (!fromLevel) throw new BadRequestException('No stock at source location');

      const available = Number(fromLevel.quantity) - Number(fromLevel.reservedQty);
      if (available < dto.quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${available}, requested: ${dto.quantity}`);
      }

      // Decrement source
      await tx.stockLevel.update({
        where: { id: fromLevel.id },
        data: { quantity: { decrement: dto.quantity } },
      });

      // Find or create destination
      const toLevel = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId } },
      });

      if (toLevel) {
        await tx.stockLevel.update({
          where: { id: toLevel.id },
          data: { quantity: { increment: dto.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId, quantity: dto.quantity, reservedQty: 0 },
        });
      }

      return tx.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dto.inventoryItemId,
          fromLocationId: dto.fromLocationId,
          toLocationId: dto.toLocationId,
          quantity: dto.quantity,
          movementType: MovementType.TRANSFER,
          notes: dto.notes,
          performedBy: userId,
          performedByName: userName,
        },
        include: { inventoryItem: true, fromLocation: true, toLocation: true },
      });
    });
  }

  async consume(companyId: string, userId: string, userName: string, dto: {
    inventoryItemId: string;
    locationId: string;
    quantity: number;
    referenceId?: string;
    referenceType?: string;
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const level = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.locationId } },
      });

      if (!level || Number(level.quantity) < dto.quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${level ? Number(level.quantity) : 0}, requested: ${dto.quantity}`);
      }

      // Decrement quantity
      const newQty = Number(level.quantity) - dto.quantity;
      // Also reduce reserved if applicable
      const reservedReduction = Math.min(Number(level.reservedQty), dto.quantity);
      await tx.stockLevel.update({
        where: { id: level.id },
        data: {
          quantity: newQty,
          reservedQty: { decrement: reservedReduction },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dto.inventoryItemId,
          fromLocationId: dto.locationId,
          quantity: dto.quantity,
          movementType: MovementType.CONSUME,
          referenceId: dto.referenceId,
          referenceType: dto.referenceType,
          performedBy: userId,
          performedByName: userName,
        },
        include: { inventoryItem: true, fromLocation: true },
      });

      // Check for low stock
      const item = await tx.inventoryItem.findUnique({ where: { id: dto.inventoryItemId } });
      const location = await tx.stockLocation.findUnique({ where: { id: dto.locationId } });
      const lowStock = item ? newQty < item.reorderPoint : false;

      return {
        ...movement,
        lowStock,
        itemName: item?.name ?? 'Unknown',
        itemSku: item?.sku ?? 'N/A',
        locationName: location?.name ?? 'Unknown',
        remainingQty: newQty,
      };
    });

    // Fire low-stock notification asynchronously (do not await to avoid blocking the response)
    if (result.lowStock) {
      this.sendLowStockNotification(companyId, result.itemName, result.itemSku, result.locationName, result.remainingQty);
    }

    return result;
  }

  private async sendLowStockNotification(companyId: string, itemName: string, itemSku: string, locationName: string, remainingQty: number) {
    try {
      const token = systemToken(companyId);
      const commsBase = process.env.COMMS_SERVICE_URL || 'http://localhost:3005';

      await axios.post(`${commsBase}/notifications/in-app`, {
        title: 'Low Stock Alert',
        body: `${itemName} (${itemSku}) is low at ${locationName}. Only ${remainingQty} remaining.`,
        type: 'LOW_STOCK_ALERT',
        recipients: [], // Empty recipients = broadcast to all company admins/managers
      }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.warn('[inventory] Low-stock notification failed:', err?.message);
    }
  }

  async adjust(companyId: string, userId: string, userName: string, dto: {
    inventoryItemId: string;
    locationId: string;
    newQuantity: number;
    reason?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const level = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.locationId } },
      });

      const oldQty = level ? Number(level.quantity) : 0;
      const diff = dto.newQuantity - oldQty;

      if (level) {
        await tx.stockLevel.update({
          where: { id: level.id },
          data: { quantity: dto.newQuantity },
        });
      } else {
        await tx.stockLevel.create({
          data: { inventoryItemId: dto.inventoryItemId, locationId: dto.locationId, quantity: dto.newQuantity, reservedQty: 0 },
        });
      }

      return tx.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dto.inventoryItemId,
          fromLocationId: diff < 0 ? dto.locationId : undefined,
          toLocationId: diff >= 0 ? dto.locationId : undefined,
          quantity: Math.abs(diff),
          movementType: MovementType.ADJUST,
          notes: dto.reason ?? `Adjusted from ${oldQty} to ${dto.newQuantity}`,
          performedBy: userId,
          performedByName: userName,
        },
        include: { inventoryItem: true, fromLocation: true, toLocation: true },
      });
    });
  }

  async returnStock(companyId: string, userId: string, userName: string, dto: {
    inventoryItemId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    notes?: string;
  }) {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException('Cannot return to the same location');
    }

    return this.prisma.$transaction(async (tx) => {
      const fromLevel = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.fromLocationId } },
      });

      if (!fromLevel) throw new BadRequestException('No stock at source location');

      const available = Number(fromLevel.quantity) - Number(fromLevel.reservedQty);
      if (available < dto.quantity) {
        throw new BadRequestException(`Insufficient stock to return. Available: ${available}, requested: ${dto.quantity}`);
      }

      await tx.stockLevel.update({
        where: { id: fromLevel.id },
        data: { quantity: { decrement: dto.quantity } },
      });

      const toLevel = await tx.stockLevel.findUnique({
        where: { inventoryItemId_locationId: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId } },
      });

      if (toLevel) {
        await tx.stockLevel.update({
          where: { id: toLevel.id },
          data: { quantity: { increment: dto.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: { inventoryItemId: dto.inventoryItemId, locationId: dto.toLocationId, quantity: dto.quantity, reservedQty: 0 },
        });
      }

      return tx.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dto.inventoryItemId,
          fromLocationId: dto.fromLocationId,
          toLocationId: dto.toLocationId,
          quantity: dto.quantity,
          movementType: MovementType.RETURN,
          notes: dto.notes ?? 'Excess stock returned from van',
          performedBy: userId,
          performedByName: userName,
        },
        include: { inventoryItem: true, fromLocation: true, toLocation: true },
      });
    });
  }

  async findMovements(companyId: string, page = 1, limit = 50, filters?: {
    inventoryItemId?: string;
    locationId?: string;
    movementType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = { companyId };
    if (filters?.inventoryItemId) where.inventoryItemId = filters.inventoryItemId;
    if (filters?.movementType) where.movementType = filters.movementType;
    if (filters?.locationId) {
      where.OR = [
        { fromLocationId: filters.locationId },
        { toLocationId: filters.locationId },
      ];
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters?.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters?.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          inventoryItem: { select: { name: true, sku: true } },
          fromLocation: { select: { name: true, type: true } },
          toLocation: { select: { name: true, type: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, count, page, limit };
  }
}
