import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { DishesModule } from './dishes/dishes.module';
import { HealthController } from './health.controller';
import { OrderItemsModule } from './order-items/order-items.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { TablesModule } from './tables/tables.module';

@Module({
  imports: [
    PrismaModule,
    CategoriesModule,
    DishesModule,
    TablesModule,
    OrdersModule,
    OrderItemsModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
