import { sql, eq } from 'drizzle-orm';
import type { ScrapedBill, ScrapedExecutiveAction } from './types.js';

// Import these from a client module that will be created
import { getDb } from './db-client.js';
import type { Bill, ExecutiveAction } from './db-types.js';

export class DatabaseService {
  
  async saveBills(bills: ScrapedBill[]): Promise<number> {
    if (bills.length === 0) return 0;
    
    let inserted = 0;
    
    for (const bill of bills) {
      try {
        // Check if bill already exists
        const existing = bill.billId 
          ? await db.select().from(Bill).where(eq(Bill.billId, bill.billId)).limit(1)
          : [];
        
        if (existing.length > 0) {
          // Update existing bill
          await db.update(Bill)
            .set({
              ...bill,
              updatedAt: new Date(),
            })
            .where(eq(Bill.billId, bill.billId!));
          
          console.log(`📝 Updated existing bill: ${bill.title?.substring(0, 60)}...`);
        } else {
          // Insert new bill
          await db.insert(Bill).values(bill);
          inserted++;
          console.log(`✅ Inserted new bill: ${bill.title?.substring(0, 60)}...`);
        }
      } catch (error) {
        console.error(`❌ Error saving bill ${bill.billId}:`, error);
      }
    }
    
    return inserted;
  }
  
  async saveExecutiveActions(actions: ScrapedExecutiveAction[]): Promise<number> {
    if (actions.length === 0) return 0;
    
    let inserted = 0;
    
    for (const action of actions) {
      try {
        // Check if action already exists
        const existing = action.actionId 
          ? await db.select().from(ExecutiveAction).where(eq(ExecutiveAction.actionId, action.actionId)).limit(1)
          : [];
        
        if (existing.length > 0) {
          // Update existing action
          await db.update(ExecutiveAction)
            .set({
              ...action,
              updatedAt: new Date(),
            })
            .where(eq(ExecutiveAction.actionId, action.actionId!));
          
          console.log(`📝 Updated existing action: ${action.title?.substring(0, 60)}...`);
        } else {
          // Insert new action
          await db.insert(ExecutiveAction).values(action);
          inserted++;
          console.log(`✅ Inserted new action: ${action.title?.substring(0, 60)}...`);
        }
      } catch (error) {
        console.error(`❌ Error saving action ${action.actionId}:`, error);
      }
    }
    
    return inserted;
  }
  
  async getStats(): Promise<{
    totalBills: number;
    totalActions: number;
    billsBySite: Record<string, number>;
    actionsBySite: Record<string, number>;
    billsByType: Record<string, number>;
    actionsByType: Record<string, number>;
  }> {
    try {
      // Get total counts
      const [billsResult] = await db.select({ count: sql`count(*)` }).from(Bill);
      const [actionsResult] = await db.select({ count: sql`count(*)` }).from(ExecutiveAction);
      
      // Get bills by site
      const billsBySiteResult = await db
        .select({ 
          sourceSite: Bill.sourceSite,
          count: sql`count(*)` 
        })
        .from(Bill)
        .groupBy(Bill.sourceSite);
      
      // Get actions by site
      const actionsBySiteResult = await db
        .select({ 
          sourceSite: ExecutiveAction.sourceSite,
          count: sql`count(*)` 
        })
        .from(ExecutiveAction)
        .groupBy(ExecutiveAction.sourceSite);
      
      // Get bills by type
      const billsByTypeResult = await db
        .select({ 
          billType: Bill.billType,
          count: sql`count(*)` 
        })
        .from(Bill)
        .where(sql`${Bill.billType} IS NOT NULL`)
        .groupBy(Bill.billType);
      
      // Get actions by type
      const actionsByTypeResult = await db
        .select({ 
          actionType: ExecutiveAction.actionType,
          count: sql`count(*)` 
        })
        .from(ExecutiveAction)
        .where(sql`${ExecutiveAction.actionType} IS NOT NULL`)
        .groupBy(ExecutiveAction.actionType);
      
      return {
        totalBills: Number(billsResult?.count || 0),
        totalActions: Number(actionsResult?.count || 0),
        billsBySite: billsBySiteResult.reduce((acc, item) => {
          if (item.sourceSite) {
            acc[item.sourceSite] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>),
        actionsBySite: actionsBySiteResult.reduce((acc, item) => {
          if (item.sourceSite) {
            acc[item.sourceSite] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>),
        billsByType: billsByTypeResult.reduce((acc, item) => {
          if (item.billType) {
            acc[item.billType] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>),
        actionsByType: actionsByTypeResult.reduce((acc, item) => {
          if (item.actionType) {
            acc[item.actionType] = Number(item.count);
          }
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      throw error;
    }
  }
}