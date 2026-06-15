import { Injectable } from '@nestjs/common';
import { SqlServerService } from '../sqlserver/sqlserver.service';
import sql from 'mssql';

@Injectable()
export class StoreRepository {
  constructor(private readonly sqlServer: SqlServerService) {}

  async cleanProducts(dbKey: string, customerId: number): Promise<void> {
    const pool = await this.sqlServer.getPool(dbKey);

    await pool
      .request()
      .input('customerId', sql.Int, customerId)
      .query('DELETE pp FROM ProductPrice pp INNER JOIN Product p ON p.ProductId = pp.ProductId WHERE p.CustomerId = @customerId');

    await pool
      .request()
      .input('customerId', sql.Int, customerId)
      .query('DELETE FROM ProductUnavailable WHERE ProductId IN (SELECT p.ProductId FROM Product p WHERE p.CustomerId = @customerId)');

    await pool
      .request()
      .input('customerId', sql.Int, customerId)
      .query('DELETE PL FROM ProductLanguage PL JOIN Product P ON PL.ProductId = P.ProductId WHERE P.CustomerId = @customerId');

    await pool
      .request()
      .input('customerId', sql.Int, customerId)
      .query('DELETE FROM MediaComponentProduct WHERE ProductId IN (SELECT p.ProductId FROM Product p WHERE p.CustomerId = @customerId)');

    await pool
      .request()
      .input('customerId', sql.Int, customerId)
      .query('DELETE FROM Product WHERE CustomerId = @customerId');
  }
}
