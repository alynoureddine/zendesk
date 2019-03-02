import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TreeService} from './tree/tree.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TreeEntity} from "./tree/tree.entity";
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerService } from './customer/customer.service';
import { CustomerSchema} from "./customer/customer.schema";
import { ZendeskService } from './zendesk/zendesk.service';


@Module({
    imports: [TypeOrmModule.forRoot({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'ali',
        password: 'pass',
        database: 'zendesk',
        entities: [TreeEntity],
        synchronize: true,
    }),
        TypeOrmModule.forFeature([TreeEntity]),
        MongooseModule.forRoot('mongodb://localhost/zendesk', { useNewUrlParser: true }),
        MongooseModule.forFeature([{ name: 'Customer', schema: CustomerSchema}])
    ],
    controllers: [AppController],
    providers: [AppService, CustomerService, TreeService, ZendeskService],
})
export class AppModule {
}
