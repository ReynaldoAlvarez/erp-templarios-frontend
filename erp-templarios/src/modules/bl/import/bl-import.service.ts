import { PrismaService } from '../../../core/database/prisma.service';
import { ValidationError, ConflictError } from '../../../core/middleware/error.middleware';
import * as fs from 'fs';
import * as path from 'path';

const prisma = PrismaService.getInstance();

interface ImportedBLRow {
  blNumber: string;
  clientNit: string;
  clientName: string;
  totalWeight: number;
  unitCount: number;
  cargoType?: string;
  originPort: string;
  customsPoint: string;
  finalDestination: string;
  vessel?: string;
  consignee?: string;
}

interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  createdBLs: { blNumber: string; clientName: string }[];
}

class BLImportService {
  /**
   * Import BLs from an array of data (parsed from Excel/CSV)
   */
  async importFromData(
    data: ImportedBLRow[],
    userId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: data.length,
      created: 0,
      skipped: 0,
      errors: [],
      createdBLs: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Assuming header row

      try {
        // Validate required fields
        if (!row.blNumber || !row.clientNit || !row.clientName) {
          result.errors.push({
            row: rowNum,
            message: 'Faltan campos requeridos: blNumber, clientNit, clientName',
          });
          continue;
        }

        // Check if BL already exists
        const existingBL = await prisma.billOfLading.findUnique({
          where: { blNumber: row.blNumber },
        });

        if (existingBL) {
          result.skipped++;
          continue;
        }

        // Find or create client
        let client = await prisma.client.findUnique({
          where: { nit: row.clientNit },
        });

        if (!client) {
          client = await prisma.client.create({
            data: {
              businessName: row.clientName,
              nit: row.clientNit,
              hasCredit: false,
            },
          });
        }

        // Create BL
        const bl = await prisma.billOfLading.create({
          data: {
            blNumber: row.blNumber,
            totalWeight: row.totalWeight || 0,
            unitCount: row.unitCount || 1,
            cargoType: row.cargoType,
            originPort: row.originPort || 'Desaguadero',
            customsPoint: row.customsPoint || 'Desaguadero',
            finalDestination: row.finalDestination || 'Cochabamba',
            vessel: row.vessel,
            consignee: row.consignee,
            clientId: client.id,
          },
        });

        result.created++;
        result.createdBLs.push({
          blNumber: bl.blNumber,
          clientName: client.businessName,
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'IMPORT',
            entity: 'BillOfLading',
            entityId: bl.id,
            newData: { importedFrom: 'Excel', row: rowNum } as any,
          },
        });
      } catch (error: any) {
        result.errors.push({
          row: rowNum,
          message: error.message || 'Error desconocido',
        });
      }
    }

    return result;
  }

  /**
   * Parse Excel file using xlsx library
   * Note: Requires xlsx package to be installed
   */
  async parseExcelFile(filePath: string): Promise<ImportedBLRow[]> {
    // This is a placeholder - actual implementation would use xlsx library
    // For now, return empty array and note that xlsx needs to be installed
    throw new Error(
      'Para importar archivos Excel, instale el paquete xlsx: npm install xlsx'
    );
  }

  /**
   * Import BLs from a simple JSON structure (alternative to Excel)
   */
  async importFromJSON(jsonData: any[], userId: string): Promise<ImportResult> {
    const data: ImportedBLRow[] = jsonData.map((item) => ({
      blNumber: item.blNumber || item.BL || item['Numero BL'],
      clientNit: item.clientNit || item.NIT || item['NIT Cliente'],
      clientName: item.clientName || item.cliente || item['Razon Social'],
      totalWeight: parseFloat(item.totalWeight || item.peso || item['Peso Total'] || 0),
      unitCount: parseInt(item.unitCount || item.unidades || item['Unidades'] || 1),
      cargoType: item.cargoType || item.cargo || item['Tipo Carga'],
      originPort: item.originPort || item.origen || item['Puerto Origen'] || 'Desaguadero',
      customsPoint: item.customsPoint || item.aduana || item['Punto Aduana'] || 'Desaguadero',
      finalDestination: item.finalDestination || item.destino || item['Destino Final'] || 'Cochabamba',
      vessel: item.vessel || item.barco || item['Embarcacion'],
      consignee: item.consignee || item.consignatario || item['Consignatario'],
    }));

    return this.importFromData(data, userId);
  }

  /**
   * Download template for BL import
   */
  getImportTemplate(): object {
    return {
      columns: [
        { name: 'blNumber', description: 'Número de Bill of Lading', required: true, example: 'BL-2024-001' },
        { name: 'clientNit', description: 'NIT del cliente', required: true, example: '123456789' },
        { name: 'clientName', description: 'Razón social del cliente', required: true, example: 'EMPRESA S.R.L.' },
        { name: 'totalWeight', description: 'Peso total en kg', required: false, example: '50000' },
        { name: 'unitCount', description: 'Cantidad de unidades/bobinas', required: false, example: '10' },
        { name: 'cargoType', description: 'Tipo de carga', required: false, example: 'Bobinas de acero' },
        { name: 'originPort', description: 'Puerto de origen', required: false, example: 'Desaguadero' },
        { name: 'customsPoint', description: 'Punto aduanero', required: false, example: 'Desaguadero' },
        { name: 'finalDestination', description: 'Destino final', required: false, example: 'Cochabamba' },
        { name: 'vessel', description: 'Embarcación', required: false, example: 'MSC Maria' },
        { name: 'consignee', description: 'Consignatario', required: false, example: 'Importador S.A.' },
      ],
      exampleRows: [
        {
          blNumber: 'BL-2024-001',
          clientNit: '123456789',
          clientName: 'EMPRESA EJEMPLO S.R.L.',
          totalWeight: 50000,
          unitCount: 10,
          cargoType: 'Bobinas de acero',
          originPort: 'Desaguadero',
          customsPoint: 'Desaguadero',
          finalDestination: 'Cochabamba',
          vessel: 'MSC Maria',
          consignee: 'Importador S.A.',
        },
      ],
    };
  }

  /**
   * Validate import data before processing
   */
  validateImportData(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      return { valid: false, errors: ['Los datos deben ser un arreglo'] };
    }

    if (data.length === 0) {
      return { valid: false, errors: ['El arreglo está vacío'] };
    }

    if (data.length > 1000) {
      errors.push('Se pueden importar máximo 1000 registros a la vez');
    }

    data.forEach((row, index) => {
      if (!row.blNumber && !row.BL && !row['Numero BL']) {
        errors.push(`Fila ${index + 1}: Falta número de BL`);
      }
      if (!row.clientNit && !row.NIT && !row['NIT Cliente']) {
        errors.push(`Fila ${index + 1}: Falta NIT del cliente`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default new BLImportService();
